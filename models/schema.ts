require('dotenv').config();
import mongoose from'mongoose';
import codeInterface from '../interfaces/codeInterface';

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
    masseyhacks: boolean;
    jumpstart: boolean;
    transactions: Array<codeInterface>;
}

interface codeSchema extends mongoose.Document{
    name: string;
    id: string;
    points: number;
    expiry?: number;
    maxUses?: number;
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
    },
    masseyhacks :{
        type: Boolean,
        require: true
    },
    jumpstart:{
        type: Boolean,
        require: true
    },
    transactions:{
        type: [],
        require: true
    }
}));

const codes = mongoose.model<codeSchema>('Code', new mongoose.Schema<codeSchema>({
    name: {
        type: String,
        require: true
    },
    id: {
        type: String,
        require: true
    },
    points: {
        type: Number,
        require: true
    },
    expiry :{
        type : Number,
        require: false
    },
    maxUses : {
        type: Number, 
        require: false
    }
}));

export {discordUsers, codes};