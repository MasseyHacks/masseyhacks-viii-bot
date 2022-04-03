require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions, MessageActionRow, MessageButton, Message } from "discord.js";
import { discordUsers } from '../models/schema';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('getuserstats')
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
                let pagination = 0;
                const length = allMembers.length;
                delete embed.description;
                embed.title = "User Stats!";
                embed.fields = [
                    {
                        name: "Name",
                        value: allMembers[pagination].name
                    },
                    {
                        name: "Discord ID",
                        value: allMembers[pagination].discordId
                    },
                    {
                        name: "Points",
                        value: allMembers[pagination].points.toString()
                    },
                    {
                        name: "Email",
                        value: allMembers[pagination].email
                    },
                    {
                        name: "Jumpstart Verified",
                        value: allMembers[pagination].jumpstart.toString()
                    },
                    {
                        name: "MasseyHacks Verified",
                        value: allMembers[pagination].masseyhacks.toString()
                    }
                ];
                embed.footer = {
                    text:`${pagination + 1}/${length}`
                };
                    
                embed.color = "GREEN";
                const backwardButton = new MessageButton().setCustomId('backward').setLabel('Back').setStyle('SECONDARY').setEmoji("◀️").setDisabled(pagination == 0);
                const forwardButton = new MessageButton().setCustomId('forward').setLabel('Forward').setStyle('SECONDARY').setEmoji("▶️").setDisabled(length == pagination + 1);
                const messageActionRow = new MessageActionRow().addComponents([backwardButton, forwardButton]);
                await interaction.editReply({components: [messageActionRow]});

                const collector = (await interaction.fetchReply() as Message).createMessageComponentCollector({idle: 60000, dispose: true});
                collector.on('collect', async i => {
                    if(i.customId == "forward" || i.customId == "backward"){
                        await i.deferUpdate();
                        if(i.customId == "forward"){
                            pagination++;
                            if(pagination + 1 == length) forwardButton.setDisabled(true);
                            backwardButton.setDisabled(false);
                        }
                        else if(i.customId == "backward"){
                            pagination--;
                            if(pagination == 0) backwardButton.setDisabled(true);
                            forwardButton.setDisabled(false);
                        }
                        embed.fields = [
                            {
                                name: "Name",
                                value: allMembers[pagination].name
                            },
                            {
                                name: "Points",
                                value: allMembers[pagination].points.toString()
                            },
                            {
                                name: "Email",
                                value: allMembers[pagination].email
                            },
                            {
                                name: "Jumpstart Verified",
                                value: allMembers[pagination].jumpstart.toString()
                            },
                            {
                                name: "MasseyHacks Verified",
                                value: allMembers[pagination].masseyhacks.toString()
                            }
                        ];
                        embed.footer = {
                            text:`${pagination + 1}/${length}`
                        };
                    
                        await i.editReply({embeds: [embed], components: [messageActionRow]});
                    }
                });
                collector.on("end", async ()=>{
                    await interaction.editReply({components : []});
                });
            }
        }
        catch(err){
        }
        await interaction.editReply({embeds : [embed]});
    }
}