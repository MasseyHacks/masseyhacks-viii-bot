require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions, MessageActionRow, MessageButton, Message } from "discord.js";
import { discordUsers, shops } from '../models/schema';

module.exports ={
    privateMessage: true,
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription("List all the items in the shop!"),
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
            embed.title = "Shop!";
            embed.color = "AQUA";
            const currentTime = Math.floor(new Date().getTime() / 1000);
            const shopItems = (await shops.find()).filter(e => (e.expiry == null || currentTime < e.expiry) && (e.maxPurchases == null || e.maxPurchases > e.purchases.length));
            if(shopItems.length == 0){
                embed.description = "There are no items in the shop! Keep an eye out for items that may be coming soon!"
            }
            else{
                embed.description = `You currently have ${userInfo.points} point(s) to spend`;
                let pagination = 0;
                const length = shopItems.length;
                embed.fields = [
                    {
                        name: "Name",
                        value: shopItems[pagination].name
                    },
                    {
                        name: "Description",
                        value: shopItems[pagination].description
                    },
                    {
                        name: "Cost",
                        value: shopItems[pagination].points.toString()
                    },
                    {
                        name: "Expiry",
                        value: (shopItems[pagination].expiry != null) ? new Date(shopItems[pagination].expiry * 1000).toString() : "No expiry"
                    },
                    {
                        name: "Availability",
                        value : (shopItems[pagination].maxPurchases != null) ? `${shopItems[pagination].maxPurchases - shopItems[pagination].purchases.length} remaining` : "Unlimited"
                    },
                    {
                        name: "Max purchases",
                        value: (shopItems[pagination].maxUserPurchases != null) ? `${shopItems[pagination].maxUserPurchases}` : "Unlimited"
                    }
                ];
                embed.footer = {
                    text:`${pagination + 1}/${length}`
                };

                const backwardButton = new MessageButton().setCustomId('backward').setLabel('Back').setStyle('SECONDARY').setEmoji("◀️").setDisabled(pagination == 0);
                const forwardButton = new MessageButton().setCustomId('forward').setLabel('Forward').setStyle('SECONDARY').setEmoji("▶️").setDisabled(length == pagination + 1);
                const purchaseButton = new MessageButton().setCustomId('purchase').setLabel('Purchase').setStyle('SUCCESS');
                const messageActionRow = new MessageActionRow().addComponents([backwardButton, forwardButton, purchaseButton]);
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
                                    value: shopItems[pagination].name
                                },
                                {
                                    name: "Description",
                                    value: shopItems[pagination].description
                                },
                                {
                                    name: "Cost",
                                    value: shopItems[pagination].points.toString()
                                },
                                {
                                    name: "Expiry",
                                    value: (shopItems[pagination].expiry != null) ? new Date(shopItems[pagination].expiry * 1000).toString() : "No expiry"
                                },
                                {
                                    name: "Availability",
                                    value : (shopItems[pagination].maxPurchases != null) ? `${shopItems[pagination].maxPurchases - shopItems[pagination].purchases.length} remaining` : "Unlimited"
                                },
                                {
                                    name: "Max purchases",
                                    value: (shopItems[pagination].maxUserPurchases != null) ? `${shopItems[pagination].maxUserPurchases}` : "Unlimited"
                                }
                            ];
                            embed.footer = {
                                text:`${pagination + 1}/${length}`
                            };
                            await i.editReply({embeds: [embed], components: [messageActionRow]});
                        }
                        else if(i.customId == "purchase"){
                            const latestShopInfo = await shops.findOne({_id: shopItems[pagination]._id});
                            const isAvailableForUser = 
                                (shopItems[pagination].maxPurchases == null || shopItems[pagination].maxPurchases - latestShopInfo.purchases.length > 0) &&
                                (shopItems[pagination].maxUserPurchases == null || shopItems[pagination].maxUserPurchases - latestShopInfo.purchases.reduce((n, val) => n + Number(val == interaction.user.id), 0)) &&
                                (shopItems[pagination].expiry == null || shopItems[pagination].expiry > Math.floor(new Date().getTime() / 1000));
                            if(isAvailableForUser){
                                latestShopInfo.purchases.push(interaction.user.id);
                                await latestShopInfo.save();
                                userInfo.points -= latestShopInfo.points;
                                userInfo.transactions.push({
                                    name: `Shop purchase: ${latestShopInfo.name}`,
                                    points: latestShopInfo.points,
                                    id: "SHOP"
                                });
                                await userInfo.save();
                                await i.editReply({
                                    embeds: [{
                                        title: "Item Purchased!",
                                        description: `You have successfully purchased: ${latestShopInfo.name} for ${latestShopInfo.points}. You currently have ${userInfo.points} point(s).`,
                                        color: "GREEN"
                                    }],
                                    components: []
                                });
                            }
                            else{
                                await i.editReply({embeds:[{
                                    title: "Purchase failed!",
                                    description: "Your purchased failed! This either means you've reached the maximum number of purchases or this item is no longer available.",
                                    color: "RED"
                                }], components: []});
                            }
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
        await interaction.editReply({embeds: [embed]});
    }
}