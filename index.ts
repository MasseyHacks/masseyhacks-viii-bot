require('dotenv').config();
import fs from 'fs';

import { Client, Collection, Intents, Permissions} from 'discord.js';
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

const commands =[];
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(f=>f.endsWith('.js'));

const rest = new REST({version: '9'}).setToken(process.env.DISCORD_TOKEN);

for (const f of commandFiles){
    const command = require(`./commands/${f}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

(async () => {
    try{
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
    }
    catch(err){
        console.log(err);
    }
})();

client.on('ready', () => {
    console.log("Ready!");
});

client.on('guildMemberAdd', async member=>{
    if(!discordUsers.exists({discordId : member.id})){
        try{
            member.send("Welcome to MasseyHacks VIII! Please verify yourself ");
        }
        catch(err){
            console.log(err);
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