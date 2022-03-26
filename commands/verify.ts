require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, CommandInteraction, GuildMember, User } from "discord.js";
import jwt from 'jsonwebtoken';
import { discordUsers } from '../models/schema';
import TokenInterface from '../interfaces/tokenInterface';

module.exports ={
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription("Verify yourself with your provided token!")
        .addStringOption(option => option.setName('token').setDescription("The token that you were emailed").setRequired(true)),
    async execute(interaction: CommandInteraction){
        await interaction.deferReply({ ephemeral: interaction.inGuild() });
        const guild = interaction.client.guilds.resolve(process.env.GUILD_ID);
        const member = guild.members.resolve(interaction.user);
        if(!member){
            await interaction.editReply({content: "Hmmm... Can't seem to find your Discord account in our Discord server. Please make sure you've joined the MasseyHacks VIII Discord Server, and try again.\n If you have joined the server and this message is showing up, please contact an Organizer."});
            return;
        }
        const isVerified = member.roles.cache.has(process.env.VERIFIED_ROLE_ID);
        if(isVerified){
            await interaction.editReply({content: "You're already verified! No need to verify yourself again."});
            return;
        }
        try{
            const decoded = jwt.verify(interaction.options.getString('token'),process.env.JWT_SECRET) as TokenInterface;
            await member.setNickname(`${decoded.firstName} ${decoded.lastName}`);

        }
        catch(err){
            await interaction.editReply('There was an error trying to verify you. Please contact an admin.');
        }
    }
}