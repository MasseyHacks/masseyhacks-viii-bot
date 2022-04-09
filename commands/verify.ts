require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import jwt from 'jsonwebtoken';
import { discordUsers } from '../models/schema';
import TokenInterface from '../interfaces/tokenInterface';

module.exports ={
    privateMessage: true,
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription("Verify yourself with your provided token!")
        .addStringOption(option => option.setName('token').setDescription("The token that you were emailed").setRequired(true)),
    async execute(interaction: CommandInteraction){
        let embed = {
            title: "Error!",
            description: "An error has occured with this command! Please try this command again or contact an admin!",
            color: "RED"
        } as MessageEmbedOptions;
        await interaction.deferReply({ ephemeral: interaction.inGuild() });
        try {
            const guild = interaction.client.guilds.resolve(process.env.GUILD_ID);
            const member = await guild.members.fetch(interaction.user.id);
            const isVerified = member.roles.cache.has(process.env.VERIFIED_ROLE_ID);
            try{
                const decoded = jwt.verify(`${process.env.JWT_HEADER}.${interaction.options.getString('token')}`,process.env.JWT_SECRET) as TokenInterface;
                const masseyhacks = decoded.category == "masseyhacks";
                const jumpstart = decoded.category == "jumpstart";
                if(isVerified){
                    if(!member.roles.cache.has(process.env.MASSEYHACKS_PARTICIPANT) && masseyhacks){
                        await member.roles.add(process.env.MASSEYHACKS_PARTICIPANT);
                        await discordUsers.findOneAndUpdate({discordId: member.id}, {masseyhacks: true});

                        embed.title = "Verification Successful!";
                        embed.description = "Thanks for verifying yourself, we've now added the MasseyHacks role to you!";
                        embed.color = "GREEN";
                    }
                    else if(!member.roles.cache.has(process.env.JUMPSTART) && jumpstart){
                        await member.roles.add(process.env.JUMPSTART);
                        await discordUsers.findOneAndUpdate({discordId: member.id}, {jumpstart: true});

                        embed.title = "Verification Successful!";
                        embed.description = "Thanks for verifying yourself, we've now added the JumpStart role to you!";
                        embed.color = "GREEN";
                    }
                    else{
                        embed.title = "Verification Failed!";
                        embed.description = "You're already verified! No need to verify yourself again.";
                    }
                }
                else if(await discordUsers.exists({email : decoded.email})){
                    embed.title = "Verification Failed!";
                    embed.description = "You have already verified yourself on our server using a different account! Please use the account that you initially verified yourself with! If you're seeing this message and you have yet to verify yourself, please contact an admin!";
                }
                else{
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
                    embed.title = "Verification Successful!";
                    embed.description = "Thanks for verifying yourself! Welcome to MasseyHacks VIII!";
                    embed.color = "GREEN";
                }
            }
            catch(err){
                embed.title = "Verification Failed!";
                embed.description = 'There was an error trying to verify you. Please contact an admin.';
            }
        }
        catch(err){
            embed.title = "Verification Failed!";
            embed.description = "Hmmm... Can't seem to find your Discord account in our Discord server. Please make sure you've joined the MasseyHacks VIII Discord Server, and try again.\nIf you have joined the server and this message is showing up, please contact an Organizer.";
        };
        await interaction.editReply({embeds : [embed]});
    }
}