require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { discordUsers } from '../models/schema';

module.exports ={
    privateMessage: true,
    data: new SlashCommandBuilder()
        .setName('points')
        .setDescription("List all the points you've accumulated!"),
    async execute(interaction: CommandInteraction){
        await interaction.deferReply({ ephemeral: interaction.inGuild() });
        const userInfo = await discordUsers.findOne({discordId : interaction.user.id});
        let embed = {
            title: "Error!",
            description: "An error has occured with this command! Please try this command again or contact an admin!",
            color: "RED"
        } as MessageEmbedOptions;
        if (!userInfo){
            embed.title = "User not found!";
            embed.description = "Hmmm... Can't seem to find your Discord account in our Discord server. Please make sure you've joined the MasseyHacks VIII Discord Server, and try again.\nIf you have joined the server and this message is showing up, please contact an Organizer.";
        }
        else{
            embed.title = "Your Points!";
            delete embed.description;
            embed.color = "AQUA";
            embed.fields = [{"name" : "Current Point Balance", "value" : userInfo.points.toString()}];
        }
        await interaction.editReply({embeds: [embed]});
    }
}