require('dotenv').config();
import fs from 'fs';

import { ApplicationCommand, Client, Collection, Intents, Permissions} from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { discordUsers } from './models/schema';

declare module "discord.js"{
    export interface Client{
        commands: Collection<string, any>
    }
}

const client = new Client({
    intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.DIRECT_MESSAGES, "GUILD_MEMBERS"]
});

const commands = [];
const privateMessageCommands = [];
const adminOnlyCommands = [];
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(f=>f.endsWith('.js'));

const rest = new REST({version: '9'}).setToken(process.env.DISCORD_TOKEN);

for (const f of commandFiles){
    const command = require(`./commands/${f}`);
    client.commands.set(command.data.name, command);
    if(command.privateMessage){
        privateMessageCommands.push(command.data.toJSON());
    }
    else{
        commands.push(command.data.toJSON());
    }
    if(command.adminOnly) adminOnlyCommands.push(command.data.toJSON().name);
}

(async () => {
    try{
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: privateMessageCommands }
        );
    }
    catch(err){
        console.log(err);
    }
})();

client.on('ready', async () => {
    console.log("Ready!");
    const allCommands = {
    };
    (await client.guilds.cache.get(process.env.GUILD_ID)?.commands.fetch()).forEach(e => {
        allCommands[e.name] = e ;
    });
    const permissions = [
        {
            id: process.env.ORGANIZER,
            type: 'ROLE',
            permission: true
        }
    ]
    adminOnlyCommands.forEach(e => {
        allCommands[e].setDefaultPermission(false);
        allCommands[e].permissions.set({permissions});
    });
});

client.on('guildMemberAdd', async member=>{
    const user = await discordUsers.findOne({discordId:member.id});
    if(user){
        member.roles.add(process.env.VERIFIED_ROLE_ID);
        member.setNickname(user.name);
        if(user.jumpstart){
            member.roles.add(process.env.JUMPSTART);
        }
        if(user.masseyhacks){
            member.roles.add(process.env.MASSEYHACKS_PARTICIPANT);
        }
    }
});

client.on('interactionCreate', async interaction=>{
    if(!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if(!command) return;
    try{
        await command.execute(interaction);
    }
    catch(err){
        console.log(err);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);

export default client;