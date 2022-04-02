require('dotenv').config();
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { discordUsers, codes } from '../models/schema';

module.exports ={
    privateMessage: true,
    data: new SlashCommandBuilder()
        .setName('code')
        .setDescription("Enter a code to redeem your points!")
        .addStringOption(option => option.setName('code').setDescription("Point Code").setRequired(true)),
    async execute(interaction: CommandInteraction){
        let embed = {
            title: "Error!",
            description: "An error has occured with this command! Please try this command again or contact an admin!",
            color: "RED"
        } as MessageEmbedOptions;
        await interaction.deferReply({ ephemeral: interaction.inGuild() });
        const currentTime = Math.floor(new Date().getTime() / 1000);
        try{
            const user = await discordUsers.findOne({discordId : interaction.user.id});
            if(!user){
                embed.title = "User not found!";
                embed.description = "Hmmm... Can't seem to find your Discord account in our Discord server. Please make sure you've joined the MasseyHacks VIII Discord Server, and try again.\nIf you have joined the server and this message is showing up, please contact an Organizer.";
            }
            else{
                const code = await codes.findOne({id: interaction.options.getString('code')});
                const codeUsed = user.transactions.some(e => e.id == interaction.options.getString('code'));
                if(!code){
                    embed.title = "Invalid Code!";
                    embed.description = "Hmmm... Seems like the code you've entered is invalid! Please ensure you've entered the right code and try again! Remember: It's case sensitive!";
                }
                else if(codeUsed){
                    embed.title = "Code already used!";
                    embed.description = "You've already enter this code before! If you're seeing this message and you haven't enter this code before, please contact an organizer!";
                }
                else if(currentTime > code.expiry){
                    embed.title = "Expired Code!";
                    embed.description = "Unfortunately, you've entered an expired code. Please ensure you enter your code as soon as possible to avoid this from happening in the future.";
                }
                else if(code.maxUses == 0){
                    embed.title = "Code no longer valid!";
                    embed.description = "Unfortunately, this code has already reached it's maximum uses! Ensure you enter your code as soon as possible!";
                }
                else{
                    user.points += code.points;
                    user.transactions.unshift({
                        name: code.name,
                        id: interaction.options.getString('code'),
                        points: code.points
                    });
                    await user.save();
                    if(code.maxUses) {
                        code.maxUses--;
                        await code.save();
                    }
                    embed.title = "Points added!";
                    embed.description = `${code.points} have been added to your account! You currently now have ${user.points} point(s)!`;
                    embed.color = "GREEN";
                }
            }
        }
        catch(err){

        }
        interaction.editReply({embeds : [embed]});
    }
}