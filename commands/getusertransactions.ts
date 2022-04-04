require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions, MessageActionRow, MessageButton, Message, MessageAttachment } from "discord.js";
import { discordUsers } from '../models/schema';

module.exports ={
    privateMessage: false,
    adminOnly: true,
    data: new SlashCommandBuilder()
        .setName('getusertransactions')
        .setDescription("Internal Use Only")
        .addStringOption(option => option.setName('discordid').setDescription("Discord ID of the user").setRequired(true)),
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
                const user = await discordUsers.findOne({discordId : interaction.options.getString('discordid')});
                if(!user){
                    embed.title = "User Not Found!"
                    embed.description = "This Discord ID is invalid! Please enter a valid Discord ID!"
                }
                else{
                    embed.title = "User Transactions!";
                    embed.color = "AQUA";
                    const length = user.transactions.length;
                    if(length == 0){
                        embed.description = "This user does not have any transactions! Go tell them to participate!"
                    }
                    else{
                        let pagination = 0;
                        delete embed.description;
                        embed.fields = [
                            {
                                name: "Name",
                                value: user.transactions[pagination].name
                            },
                            {
                                name: "ID",
                                value: user.transactions[pagination].id
                            },
                            {
                                name: "Points",
                                value: user.transactions[pagination].points.toString()
                            }
                        ];
                        embed.footer = {
                            text:`${pagination + 1}/${length}`
                        };
    
                        const backwardButton = new MessageButton().setCustomId('backward').setLabel('Back').setStyle('SECONDARY').setEmoji("◀️").setDisabled(pagination == 0);
                        const forwardButton = new MessageButton().setCustomId('forward').setLabel('Forward').setStyle('SECONDARY').setEmoji("▶️").setDisabled(length == pagination + 1);
                        const messageActionRow = new MessageActionRow().addComponents([backwardButton, forwardButton]);
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
                                            value: user.transactions[pagination].name
                                        },
                                        {
                                            name: "ID",
                                            value: user.transactions[pagination].id
                                        },
                                        {
                                            name: "Points",
                                            value: user.transactions[pagination].points.toString()
                                        }
                                    ];
                                    embed.footer = {
                                        text:`${pagination + 1}/${length}`
                                    };
                                    await i.editReply({embeds: [embed], components: [messageActionRow]});
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
        }
        catch(err){
        }
        interaction.editReply({embeds : [embed]});
    }
}