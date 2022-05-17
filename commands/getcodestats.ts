require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions, MessageActionRow, MessageButton, Message, MessageAttachment } from "discord.js";
import { codes, discordUsers } from '../models/schema';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('getcodestats')
        .setDescription("Internal Use Only")
        .addStringOption(option => option.setName('code').setDescription("Point Code").setRequired(true)),
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
                const code = await codes.findOne({id : interaction.options.getString('code')});
                if(!code){
                    embed.title = "Code Not Found!"
                    embed.description = "This code is invalid! Please enter a valid code!"
                }
                else{
                    embed.title = "Code Info!";
                    embed.color = "AQUA";
                    delete embed.description;
                    embed.fields = [
                        {
                            name: "Name",
                            value: code.name
                        },
                        {
                            name: "Points",
                            value: code.points.toString()
                        },
                        {
                            name: "Code",
                            value: code.id
                        },
                        {
                            name: "Expiry",
                            value: (code.expiry != null) ? new Date(code.expiry * 1000).toString() : "No expiry"
                        },
                        {
                            name: "Uses",
                            value: code.usedBy.length.toString()
                        },
                        {
                            name: "Max Uses",
                            value : (code.maxUses != null) ? `${code.maxUses}` : "Unlimited"
                        }
                    ];

                    const exportButton = new MessageButton().setCustomId('export').setLabel('Export Uses').setStyle('PRIMARY');
                    const disableButton = new MessageButton().setCustomId('disable').setLabel('Disable').setStyle('DANGER');
                    const deleteButton = new MessageButton().setCustomId('delete').setLabel('Delete').setStyle('DANGER');
                    const messageActionRow = new MessageActionRow().addComponents([exportButton, disableButton, deleteButton]);
                    await interaction.editReply({components: [messageActionRow]});
    
                    const collector = (await interaction.fetchReply() as Message).createMessageComponentCollector({idle: 60000, dispose: true});
                    collector.on('collect', async i => {
                        await i.deferUpdate();
                        try{
                            if(i.customId == "export"){
                                const purchases = (await discordUsers.find({discordId : {$in: code.usedBy}})).map(object => Object.values({
                                    discordId: object.discordId,
                                    name: object.name
                                }).join(',')).join('\r\n');
                                await i.followUp({embeds : [
                                    {
                                        title: "Code Uses",
                                        description: `Here are all the purchases for ${code.name} in a CSV format!`,
                                        color: "GREEN"
                                    }
                                ],
                                files: [new MessageAttachment(Buffer.from("discordId,name\r\n" + purchases, "utf-8"), 'uses.csv')]
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
                                            description: `Are you sure you want to disable ${code.name}? Note that this action is **irreversible**.`,
                                            color: "RED"
                                        }
                                    ],
                                    components:[deleteActionRow]
                                });
                            }
                            else if(i.customId == "confirmDisable"){
                                await codes.findOneAndUpdate({_id: code._id}, {expiry: 1});
                                await i.editReply({
                                    embeds: [
                                        {
                                            title: "Code Disabled",
                                            description: `Alright, ${code.name} has been disabled!`, 
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
                                            description: `Alright, ${code.name} has not been disabled!`, 
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
                                            description: `Are you sure you want to delete ${code.name}? Note that this action is **irreversible**.`,
                                            color: "RED"
                                        }
                                    ],
                                    components:[deleteActionRow]
                                });
                            }
                            else if(i.customId == "confirmDelete"){
                                await codes.findOneAndDelete({_id: code._id});
                                await i.editReply({
                                    embeds: [
                                        {
                                            title: "Code Deleted",
                                            description: `Alright, ${code.name} has been deleted!`, 
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
                                            description: `Alright, ${code.name} has not been deleted!`, 
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