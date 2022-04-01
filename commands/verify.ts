require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
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
            await interaction.editReply({content: "Hmmm... Can't seem to find your Discord account in our Discord server. Please make sure you've joined the MasseyHacks VIII Discord Server, and try again.\nIf you have joined the server and this message is showing up, please contact an Organizer."});
            return;
        }
        const isVerified = member.roles.cache.has(process.env.VERIFIED_ROLE_ID);
        try{
            const decoded = jwt.verify(interaction.options.getString('token'),process.env.JWT_SECRET) as TokenInterface;
            const masseyhacks = decoded.category == "masseyhacks";
            const jumpstart = decoded.category == "jumpstart";
            if(isVerified){
                if(!member.roles.cache.has(process.env.MASSEYHACKS_PARTICIPANT) && masseyhacks){
                    await interaction.editReply({content: "Thanks for verifying yourself, we've now added the MasseyHacks role to you!"});
                    await member.roles.add(process.env.MASSEYHACKS_PARTICIPANT);
                    await discordUsers.findOneAndUpdate({discordId: member.id}, {masseyhacks: true});
                }
                else if(!member.roles.cache.has(process.env.JUMPSTART) && jumpstart){
                    await interaction.editReply({content: "Thanks for verifying yourself, we've now added the MasseyHacks role to you!"});
                    await member.roles.add(process.env.JUMPSTART);
                    await discordUsers.findOneAndUpdate({discordId: member.id}, {jumpstart: true});
                }
                else
                    await interaction.editReply({content: "You're already verified! No need to verify yourself again."});
                return;
            }
            if(await discordUsers.exists({email : decoded.email})){
                await interaction.editReply("You have already verified yourself on our server using a different account! Please use the account that you initially verified yourself with!\nIf you're seeing this message and you have yet to verify yourself, please contact an admin!");
                return;
            }
            const fullName = `${decoded.firstName} ${decoded.lastName}`;
            await discordUsers.create({
                discordId: member.id,
                points: 0,
                email: decoded.email,
                name: fullName,
                masseyhacks: masseyhacks,
                jumpstart: jumpstart
            });
            await member.setNickname(fullName);
            await member.roles.add(process.env.VERIFIED_ROLE_ID);
            if(decoded.category == "masseyhacks"){
                await member.roles.add(process.env.MASSEYHACKS_PARTICIPANT);
            }
            else if(decoded.category == "jumpstart"){
                await member.roles.add(process.env.JUMPSTART);
            }
            await interaction.editReply("Thanks for verifying yourself! Welcome to MasseyHacks VIII!")
        }
        catch(err){
            await interaction.editReply('There was an error trying to verify you. Please contact an admin.');
        }
    }
}