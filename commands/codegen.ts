require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { codes } from '../models/schema';
import crypto from 'crypto';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('codegen')
        .setDescription("Internal Use Only")
        .addStringOption(option => option.setName('name').setDescription("Name for the code (i.e. the event/workshop name)").setRequired(true))
        .addNumberOption(option => option.setName('points').setDescription("Number of points awarded").setRequired(true))
        .addNumberOption(option => option.setName("expiry").setDescription("Expiry time of this code (in UNIX Timestamp UTC)").setRequired(false))
        .addNumberOption(option => option.setName("maxuses").setDescription("Max uses for this code").setRequired(false)),
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
            const currentTime = Math.floor(new Date().getTime() / 1000);
            const maxUsesIsInvalid = interaction.options.getNumber("maxuses") != null && (!Number.isInteger(interaction.options.getNumber("maxuses")) || interaction.options.getNumber("maxuses")) <= 0;
            const expiryIsInvalid = interaction.options.getNumber("expiry") != null && (!Number.isInteger(interaction.options.getNumber("expiry")) || interaction.options.getNumber("expiry") <= currentTime);
            const pointsIsInvalid = !Number.isInteger(interaction.options.getNumber("points")) || interaction.options.getNumber("points") <= 0;
            if(!member.roles.cache.has(process.env.ORGANIZER)){
                embed.title = "Permission Denied!";
                embed.description = "You don't have permission to access this command!";
            }
            else if(maxUsesIsInvalid || expiryIsInvalid || pointsIsInvalid){
                embed.title = "Invalid Entry";
                embed.description = "You have some invalid fields:"
                embed.fields = [];
                if(pointsIsInvalid){
                    embed.fields.push({
                        name: "Points",
                        value: `You have entered ${interaction.options.getNumber("points")}, which is invalid. Acceptable values are integers greater than 0.`
                    })
                }
                if(maxUsesIsInvalid){
                    embed.fields.push({
                        name: 'Max Uses',
                        value: `You have entered ${interaction.options.getNumber("maxuses")}, which is invalid. Acceptable values are integers greater than 0.`
                    })
                }
                if(expiryIsInvalid){
                    embed.fields.push({
                        name: "Expiry",
                        value: `You have entered ${interaction.options.getNumber("expiry")}, which is invalid. Acceptable values are integers in the future.`
                    })
                }
                
            }
            else{
                const allCodes = await codes.find();
                const code = (() => {
                    let newCode = crypto.randomBytes(6).toString('hex');
                    while (allCodes.some(e => e.id == newCode)) newCode = crypto.randomBytes(6).toString('hex');
                    return newCode;
                })();
                await codes.create({
                    name: interaction.options.getString('name'),
                    id: code,
                    points: interaction.options.getNumber('points'),
                    ...interaction.options.getNumber("expiry") != null && {expiry: interaction.options.getNumber("expiry")},
                    ...interaction.options.getNumber("maxuses") != null && {maxUses: interaction.options.getNumber("maxuses")}
                });
                embed.title = "Code Generated!";
                embed.description = "Code has been successfully generated with the following information:";
                embed.fields = [
                    {
                        name: 'Name',
                        value: interaction.options.getString('name'),
                        inline: true
                    },
                    {
                        name: 'Code',
                        value: code,
                        inline: true
                    },
                    {
                        name: 'Points',
                        value: interaction.options.getNumber('points').toString(),
                        inline: true
                    },
                    {
                        name: 'Expiry',
                        value: interaction.options.getNumber("expiry") ? new Date(interaction.options.getNumber("expiry")).toString() : "No expiry",
                        inline: true
                    },
                    {
                        name: 'Max Uses',
                        value: interaction.options.getNumber("maxuses")?.toString() || "Unlimited",
                        inline: true
                    }
                ];
                embed.color = "GREEN";
            }
        }
        catch(err){
        }
        interaction.editReply({embeds : [embed]});
    }
}