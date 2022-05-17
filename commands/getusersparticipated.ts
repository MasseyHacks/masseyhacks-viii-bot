require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions, MessageActionRow, MessageButton, Message, MessageAttachment } from "discord.js";
import { discordUsers } from '../models/schema';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('getusersparticipated')
        .setDescription("Internal Use Only"),
    async execute(interaction: CommandInteraction){
        let embed = {
            title: "Error!",
            description: "An error has occured with this command! Please try this command again or contact an admin!",
            color: "RED"
        } as MessageEmbedOptions;
        await interaction.deferReply({ ephemeral: false });
        try{
            const guild = interaction.client.guilds.resolve(process.env.GUILD_ID);
            const member = await guild.members.fetch(interaction.user.id);
            if(!member.roles.cache.has(process.env.ORGANIZER)){
                embed.title = "Permission Denied!";
                embed.description = "You don't have permission to access this command!";
            }
            else{
                embed.title = "User List!"
                embed.color = "AQUA";
                embed.description = `Here's a list of users with at least 1 transaction!`;
                const users = (await discordUsers.find({transactions: {$exists: true, $not: {$size: 0}}})).map(object => Object.values({
                    discordId: object.discordId,
                    name: object.name,
                    points: object.points
                }).join(',')).join('\r\n');
                interaction.editReply({files: [new MessageAttachment(Buffer.from("discordId,name,points\r\n" + users, "utf-8"), 'uses.csv')]});
            }
        }
        catch(err){
        }
        interaction.editReply({embeds : [embed]});
    }
}