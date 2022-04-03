require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions, MessageActionRow, MessageButton, Message } from "discord.js";
import { discordUsers } from '../models/schema';

module.exports ={
    privateMessage: true,
    data: new SlashCommandBuilder()
        .setName('transactions')
        .setDescription("List all the transactions for all the points you've accumulated!"),
    async execute(interaction: CommandInteraction){
        await interaction.deferReply({ ephemeral: interaction.inGuild() });
        const userInfo = await discordUsers.findOne({discordId : interaction.user.id});
        let embed = {
            title: "Error!",
            description: "An error has occured with this command! Please try this command again or contact an admin!",
            color: "RED"
        } as MessageEmbedOptions;
        if (!userInfo){
            embed.title = "User not found!";
            embed.description = "Hmmm... Can't seem to find your Discord account in our Discord server. Please make sure you've joined the MasseyHacks VIII Discord Server, and try again.\nIf you have joined the server and this message is showing up, please contact an Organizer.";
        }
        else{
            embed.title = "Your Transactions!";
            embed.color = "AQUA";
            if(userInfo.transactions.length == 0){
                embed.description = "None! Start participating in activities to earn some points!"
            }
            else{
                delete embed.description;
                let pagination = 0;
                const length = userInfo.transactions.length;
                embed.fields = [
                    {
                        name: "Name",
                        value: userInfo.transactions[pagination].name
                    },
                    {
                        name: "Points",
                        value: userInfo.transactions[pagination].points.toString()
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
                                value: userInfo.transactions[pagination].name
                            },
                            {
                                name: "Points",
                                value: userInfo.transactions[pagination].points.toString()
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
        await interaction.editReply({embeds: [embed]});
    }
}