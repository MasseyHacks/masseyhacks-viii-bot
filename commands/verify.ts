require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import jwt from 'jsonwebtoken';

module.exports ={
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription("Verify yourself with your provided token!")
        .addStringOption(option => option.setName('token').setDescription("The token that you were emailed").setRequired(true)),
    async execute(interaction: CommandInteraction){
        const member = interaction.user;
        await interaction.deferReply({ ephemeral: true });
        
    }

}