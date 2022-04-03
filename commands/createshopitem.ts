require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { shops } from '../models/schema';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('createshopitem')
        .setDescription("Internal Use Only")
        .addStringOption(option => option.setName('name').setDescription("Name for the item").setRequired(true))
        .addStringOption(option => option.setName("description").setDescription("Description of item").setRequired(true))
        .addNumberOption(option => option.setName('points').setDescription("Point cost").setRequired(true))
        .addNumberOption(option => option.setName("expiry").setDescription("Expiry time of this code (in UNIX Timestamp UTC)").setRequired(false))
        .addNumberOption(option => option.setName("maxpurchases").setDescription("Max purchases of this item (overall)").setRequired(false))
        .addNumberOption(option => option.setName("maxuserpurchases").setDescription("Max purchases of this item for a single user").setRequired(false)),
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
            const maxPurchasesIsInvalid = interaction.options.getNumber("maxpurchases") != null && (!Number.isInteger(interaction.options.getNumber("maxpurchases")) || interaction.options.getNumber("maxpurchases")) <= 0;
            const maxUserPurchasesIsInvalid = interaction.options.getNumber("maxuserpurchases") != null && (!Number.isInteger(interaction.options.getNumber("maxuserpurchases")) || interaction.options.getNumber("maxuserpurchases")) <= 0;
            const expiryIsInvalid = interaction.options.getNumber("expiry") != null && (!Number.isInteger(interaction.options.getNumber("expiry")) || interaction.options.getNumber("expiry") <= currentTime);
            const pointsIsInvalid = !Number.isInteger(interaction.options.getNumber("points")) || interaction.options.getNumber("points") < 0;
            if(!member.roles.cache.has(process.env.ORGANIZER)){
                embed.title = "Permission Denied!";
                embed.description = "You don't have permission to access this command!";
            }
            else if(maxPurchasesIsInvalid || expiryIsInvalid || pointsIsInvalid || maxUserPurchasesIsInvalid){
                embed.title = "Invalid Entry";
                embed.description = "You have some invalid fields:"
                embed.fields = [];
                if(pointsIsInvalid){
                    embed.fields.push({
                        name: "Points",
                        value: `You have entered ${interaction.options.getNumber("points")}, which is invalid. Acceptable values are integers greater than or equal to 0.`
                    })
                }
                if(maxPurchasesIsInvalid){
                    embed.fields.push({
                        name: 'Max Purchases',
                        value: `You have entered ${interaction.options.getNumber("maxpurchases")}, which is invalid. Acceptable values are integers greater than 0.`
                    })
                }
                if(maxUserPurchasesIsInvalid){
                    embed.fields.push({
                        name: 'Max User Purchases',
                        value: `You have entered ${interaction.options.getNumber("maxuserpurchases")}, which is invalid. Acceptable values are integers greater than 0.`
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
                await shops.create({
                    name: interaction.options.getString('name'),
                    description: interaction.options.getString("description"),
                    points: interaction.options.getNumber('points'),
                    ...interaction.options.getNumber("expiry") != null && {expiry: interaction.options.getNumber("expiry")},
                    ...interaction.options.getNumber("maxpurchases") != null && {maxPurchases: interaction.options.getNumber("maxpurchases")},
                    ...interaction.options.getNumber("maxuserpurchases") != null && {maxUserPurchases : interaction.options.getNumber("maxuserpurchases")}
                });
                embed.title = "Shop Item Generated!";
                embed.description = "Shop item has been successfully generated with the following information:";
                embed.fields = [
                    {
                        name: 'Name',
                        value: interaction.options.getString('name'),
                        inline: true
                    },
                    {
                        name: 'Description',
                        value: interaction.options.getString("description"),
                        inline: true
                    },
                    {
                        name: 'Point Cost',
                        value: interaction.options.getNumber('points').toString(),
                        inline: true
                    },
                    {
                        name: 'Expiry',
                        value: interaction.options.getNumber("expiry") ? new Date(interaction.options.getNumber("expiry") * 1000).toString() : "No expiry",
                        inline: true
                    },
                    {
                        name: 'Max Purchases',
                        value: interaction.options.getNumber("maxpurchases")?.toString() || "Unlimited",
                        inline: true
                    },
                    {
                        name: 'Max User Purchases',
                        value: interaction.options.getNumber("maxuserpurchases")?.toString() || "Unlimited",
                        inline: true
                    },
                ];
                embed.color = "GREEN";
            }
        }
        catch(err){
        }
        interaction.editReply({embeds : [embed]});
    }
}