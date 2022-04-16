require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions, MessageActionRow, MessageButton, Message, MessageAttachment } from "discord.js";
import { codes, discordUsers } from '../models/schema';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('getallcodes')
        .setDescription("Internal Use Only"),
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
            if(!member.roles.cache.has(process.env.ORGANIZER)){
                embed.title = "Permission Denied!";
                embed.description = "You don't have permission to access this command!";
            }
            else{
                const codeItems = await codes.find();
                const length = codeItems.length;
                embed.title = "Code Info!";
                embed.color = "AQUA";
                if(length == 0){
                    embed.description = "No codes are available! Go add something!"
                }
                else{
                    delete embed.description;
                    let pagination = 0;
                    embed.fields = [
                        {
                            name: "Name",
                            value: codeItems[pagination].name
                        },
                        {
                            name: "Points",
                            value: codeItems[pagination].points.toString()
                        },
                        {
                            name: "Code",
                            value: codeItems[pagination].id
                        },
                        {
                            name: "Expiry",
                            value: (codeItems[pagination].expiry != null) ? new Date(codeItems[pagination].expiry * 1000).toString() : "No expiry"
                        },
                        {
                            name: "Uses",
                            value: codeItems[pagination].usedBy.length.toString()
                        },
                        {
                            name: "Max Uses",
                            value : (codeItems[pagination].maxUses != null) ? `${codeItems[pagination].maxUses}` : "Unlimited"
                        }
                    ];
                    embed.footer = {
                        text:`${pagination + 1}/${length}`
                    };
    
                    const backwardButton = new MessageButton().setCustomId('backward').setLabel('Back').setStyle('SECONDARY').setEmoji("◀️").setDisabled(pagination == 0);
                    const forwardButton = new MessageButton().setCustomId('forward').setLabel('Forward').setStyle('SECONDARY').setEmoji("▶️").setDisabled(length == pagination + 1);
                    const exportButton = new MessageButton().setCustomId('export').setLabel('Export Uses').setStyle('PRIMARY');
                    const disableButton = new MessageButton().setCustomId('disable').setLabel('Disable').setStyle('DANGER');
                    const deleteButton = new MessageButton().setCustomId('delete').setLabel('Delete').setStyle('DANGER');
                    const messageActionRow = new MessageActionRow().addComponents([backwardButton, forwardButton, exportButton, disableButton, deleteButton]);
                    await interaction.editReply({components: [messageActionRow]});
    
                    const collector = (await interaction.fetchReply() as Message).createMessageComponentCollector({idle: 60000, dispose: true});
                    collector.on('collect', async i => {
                        await i.deferUpdate();
                        try{
                            if(i.customId == "forward" || i.customId == "backward"){
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
                                        value: codeItems[pagination].name
                                    },
                                    {
                                        name: "Points",
                                        value: codeItems[pagination].points.toString()
                                    },
                                    {
                                        name: "Code",
                                        value: codeItems[pagination].id
                                    },
                                    {
                                        name: "Expiry",
                                        value: (codeItems[pagination].expiry != null) ? new Date(codeItems[pagination].expiry * 1000).toString() : "No expiry"
                                    },
                                    {
                                        name: "Uses",
                                        value: codeItems[pagination].usedBy.length.toString()
                                    },
                                    {
                                        name: "Max Uses",
                                        value : (codeItems[pagination].maxUses != null) ? `${codeItems[pagination].maxUses}` : "Unlimited"
                                    }
                                ];
                                embed.footer = {
                                    text:`${pagination + 1}/${length}`
                                };
                                await i.editReply({embeds: [embed], components: [messageActionRow]});
                            }
                            else if(i.customId == "export"){
                                const purchases = (await discordUsers.find({discordId : {$in: codeItems[pagination].usedBy}})).map(object => Object.values({
                                    discordId: object.discordId,
                                    name: object.name
                                }).join(',')).join('\r\n');
                                await i.followUp({embeds : [
                                    {
                                        title: "Code Uses",
                                        description: `Here are all the purchases for ${codeItems[pagination].name} in a CSV format!`,
                                        color: "GREEN"
                                    }
                                ],
                                files: [new MessageAttachment(Buffer.from("discordId,name,numPurchases\r\n" + purchases, "utf-8"), 'uses.csv')]
                                });
                            }
                            else if(i.customId == "disable"){
                                const cancelButton = new MessageButton().setCustomId('cancelDisable').setLabel('Cancel').setStyle('PRIMARY');
                                const confirmButton = new MessageButton().setCustomId('confirmDisable').setLabel('Confirm').setStyle('DANGER');
                                const deleteActionRow = new MessageActionRow().addComponents([cancelButton, confirmButton]);
                                await i.editReply({
                                    embeds : [
                                        {
                                            title: "Confirm Disable",
                                            description: `Are you sure you want to disable ${codeItems[pagination].name}? Note that this action is **irreversible**.`,
                                            color: "RED"
                                        }
                                    ],
                                    components:[deleteActionRow]
                                });
                            }
                            else if(i.customId == "confirmDisable"){
                                await codes.findOneAndUpdate({_id: codeItems[pagination]._id}, {expiry: 1});
                                await i.editReply({
                                    embeds: [
                                        {
                                            title: "Code Disabled",
                                            description: `Alright, ${codeItems[pagination].name} has been disabled!`, 
                                            color: "GREEN"
                                        }
                                    ],
                                    components: []
                                });
                            }
                            else if(i.customId == "cancelDisable"){
                                await i.editReply({
                                    embeds: [
                                        {
                                            title: "Action Cancelled",
                                            description: `Alright, ${codeItems[pagination].name} has not been disabled!`, 
                                            color: "GREEN"
                                        }
                                    ],
                                    components: []
                                });
                            }
                            else if(i.customId == "delete"){
                                const cancelButton = new MessageButton().setCustomId('cancelDelete').setLabel('Cancel').setStyle('PRIMARY');
                                const confirmButton = new MessageButton().setCustomId('confirmDelete').setLabel('Confirm').setStyle('DANGER');
                                const deleteActionRow = new MessageActionRow().addComponents([cancelButton, confirmButton]);
                                await i.editReply({
                                    embeds : [
                                        {
                                            title: "Confirm Delete",
                                            description: `Are you sure you want to delete ${codeItems[pagination].name}? Note that this action is **irreversible**.`,
                                            color: "RED"
                                        }
                                    ],
                                    components:[deleteActionRow]
                                });
                            }
                            else if(i.customId == "confirmDelete"){
                                await codes.findOneAndDelete({_id: codeItems[pagination]._id});
                                await i.editReply({
                                    embeds: [
                                        {
                                            title: "Code Deleted",
                                            description: `Alright, ${codeItems[pagination].name} has been deleted!`, 
                                            color: "GREEN"
                                        }
                                    ],
                                    components: []
                                });
                            }
                            else if(i.customId == "cancelDelete"){
                                await i.editReply({
                                    embeds: [
                                        {
                                            title: "Action Cancelled",
                                            description: `Alright, ${codeItems[pagination].name} has not been deleted!`, 
                                            color: "GREEN"
                                        }
                                    ],
                                    components: []
                                });
                            }
                        }
                        catch(err){
                            await i.editReply({embeds:[{
                                title: "Error!",
                                description: "An error has occured with this command! Please try this command again or contact an admin!",
                                color: "RED"
                            }], components: []});
                        }
                    });
                    collector.on("end", async ()=>{
                        await interaction.editReply({components : []});
                    });
                }
            }
        }
        catch(err){
        }
        interaction.editReply({embeds : [embed]});
    }
}