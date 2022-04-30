require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { discordUsers } from '../models/schema';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription("List the leaderboard of the top 10 participants along with statistics!"),
    async execute(interaction: CommandInteraction){
        await interaction.deferReply({ ephemeral: interaction.inGuild() });
        let embed = {
            title: "Error!",
            description: "An error has occured with this command! Please try this command again or contact an admin!",
            color: "RED"
        } as MessageEmbedOptions;
        try{
            const allMembers = (await discordUsers.find()).sort((a, b) => b.points - a.points);
            const nonZeroMembers = allMembers.filter(e => e.points > 0);
            let sum = 0;
            nonZeroMembers.forEach(e => {sum += e.points});
            const nonZeroMean = (nonZeroMembers.length != 0) ? (sum / nonZeroMembers.length) : 0;
            const mean = (allMembers.length != 0) ? sum / allMembers.length : 0;
            const nonZeroMedian = (nonZeroMembers.length != 0) ? ((nonZeroMembers.length % 2 == 1) ? nonZeroMembers[(nonZeroMembers.length - 1)/2].points : (nonZeroMembers[nonZeroMembers.length/2 - 1].points + nonZeroMembers[nonZeroMembers.length / 2].points) / 2) : 0;
            const median = (allMembers.length != 0) ? ((allMembers.length % 2 == 1) ? allMembers[(allMembers.length - 1)/2].points : (allMembers[allMembers.length/2 - 1].points + allMembers[allMembers.length / 2].points) / 2) : 0;
            
            let numOnLeaderboard = nonZeroMembers.length < 10 ? nonZeroMembers.length : 10;
            if(numOnLeaderboard != 0){
                const ranks = [], names = [], points = [];
    
                for(let i = 0; i < numOnLeaderboard; i++){
                    ranks.push(`${i+1}`);
                    names.push(nonZeroMembers[i].name);
                    points.push(nonZeroMembers[i].points);
                }
    
                embed.title = "Leaderboard!";
                embed.description = `Top 10 Leaderboard (based off non-zero point values):`
                embed.fields = [
    
                    {
                        name: "Rank",
                        value: ranks.join("\n"),
                        inline: true
                    },
                    {
                        name: "Name",
                        value: names.join("\n"),
                        inline: true
                    },
                    {
                        name: "Statistics:",
                        value: `Non-Zero Mean: ${nonZeroMean}\nMean: ${mean}\nNon-Zero Median: ${nonZeroMedian}\nMedian: ${median}`
                    }
                ];
            }
            else{
                embed.title = "Leaderboard!";
                embed.description = `Top 10 Leaderboard (based off non-zero point values):\nNo-one! Go earn some points!`
                embed.fields = [
                    {
                        name: "Statistics:",
                        value: `Non-Zero Mean: ${nonZeroMean}\nMean: ${mean}\nNon-Zero Median: ${nonZeroMedian}\nMedian: ${median}`
                    }
                ];
            }
            embed.color = "AQUA";
        }
        catch(err){}
        await interaction.editReply({embeds: [embed]});
    }
}