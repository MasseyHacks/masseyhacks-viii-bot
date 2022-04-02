require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { discordUsers } from '../models/schema';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('getpointsuser')
        .setDescription("Internal Use Only")
        .addStringOption(option => option.setName('discordid').setDescription("Discord ID of the user(s) (Comma seperated if multiple)").setRequired(true)),
    async execute(interaction: CommandInteraction){
        await interaction.deferReply({ ephemeral: false });
        let embed = {
            title: "Error!",
            description: "An error has occured with this command! Please try this command again or contact an admin!",
            color: "RED"
        } as MessageEmbedOptions;
        try{
            const guild = interaction.client.guilds.resolve(process.env.GUILD_ID);
            const member = await guild.members.fetch(interaction.user.id);
            const ids = interaction.options.getString("discordid").split(",");
            const allMembers = await discordUsers.find({discordId : {$in : ids}});
            if(!member.roles.cache.has(process.env.ORGANIZER)){
                embed.title = "Permission Denied!";
                embed.description = "You don't have permission to access this command!";
            }
            else if(!allMembers.length){
                embed.title = "Invalid Entry";
                embed.description = "You have some invalid fields:"
                embed.fields = [];
                if(!allMembers.length){
                    embed.fields.push({
                        name: "Discord IDs",
                        value: "You have entered invalid Discord IDs. Please double your Discord IDs and try again."
                    })
                }
            }
            else{
                embed.title = "Points!";
                embed.description = `Points of the following users:`;
                embed.fields = [];
                allMembers.forEach(e => {
                    embed.fields.push({
                        name: e.name,
                        value: e.points.toString(),
                        inline: true
                    });
                });

                embed.color = "GREEN";
            }
        }
        catch(err){
        }
        interaction.editReply({embeds : [embed]});
    }
}