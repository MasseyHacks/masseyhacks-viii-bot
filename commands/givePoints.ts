require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { codes, discordUsers } from '../models/schema';
import crypto from 'crypto';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('givepoints')
        .setDescription("Internal Use Only")
        .addStringOption(option => option.setName('discordid').setDescription("Discord ID of the user(s) (Comma seperated if multiple)").setRequired(true))
        .addNumberOption(option => option.setName('points').setDescription("Number of points awarded").setRequired(true))
        .addStringOption(option => option.setName('name').setDescription("Name of transaction").setRequired(true)),
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
            const pointsIsInvalid = !Number.isInteger(interaction.options.getNumber("points"));
            const ids = interaction.options.getString("discordid").split(",");
            const allMembers = await discordUsers.find({discordId : {$in : ids}});
            if(!member.roles.cache.has(process.env.ORGANIZER)){
                embed.title = "Permission Denied!";
                embed.description = "You don't have permission to access this command!";
            }
            else if(pointsIsInvalid || !allMembers.length){
                embed.title = "Invalid Entry";
                embed.description = "You have some invalid fields:"
                embed.fields = [];
                if(pointsIsInvalid){
                    embed.fields.push({
                        name: "Points",
                        value: `You have entered ${interaction.options.getNumber("points")}, which is invalid. Acceptable values are integers.`
                    })
                }
                if(!allMembers.length){
                    embed.fields.push({
                        name: "Discord IDs",
                        value: "You have entered invalid Discord IDs. Please double your Discord IDs and try again."
                    })
                }
            }
            else{
                const names = allMembers.map(e => e.name).join(", ");
                allMembers.forEach(e => {
                    e.points += interaction.options.getNumber("points");
                    e.transactions.unshift({
                        id: "INTERNAL",
                        name: interaction.options.getString("name"),
                        points: interaction.options.getNumber("points")
                    });
                    e.save();
                });
                embed.title = "Awarded Points!";
                embed.description = `Awarded ${interaction.options.getNumber("points")} point(s) under the reason ${interaction.options.getString("name")} to:\n ${names}`;
                embed.color = "GREEN";
            }
        }
        catch(err){
        }
        interaction.editReply({embeds : [embed]});
    }
}