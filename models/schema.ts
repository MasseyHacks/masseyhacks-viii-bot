require('dotenv').config();
import mongoose from'mongoose';

mongoose.connect(process.env.DB_URL).then(() =>{
    console.log("Connected to MongoDB");
}).catch(err => {
    console.log("Error connecting to MongoDB!", err);
});

interface userSchema extends mongoose.Document{
    name: string;
    discordId: string;
    email: string;
    points: number;
}

const discordUsers = mongoose.model<userSchema>('DiscordUser', new mongoose.Schema<userSchema>({
    name: {
        type: String,
        require: true
    },
    discordId: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    points: {
        type: Number,
        require: true
    }
}));

export {discordUsers};