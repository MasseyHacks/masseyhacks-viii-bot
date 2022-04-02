require('dotenv').config();
import fs from 'fs';
import readline from 'readline';
import jwt from 'jsonwebtoken';

const createNewCSV = async (fileName: fs.PathLike) => {
    const entryObjs = [];
    const fileStream = fs.createReadStream(fileName);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const entryData = line.split(',');
        entryData.push(generateJWT(entryData[0], entryData[1], entryData[2]));
        entryObjs.push(entryData.join(','));
    }

    outputToCSV(entryObjs.join("\n"));
};

const outputToCSV = (data: string) => {
    fs.writeFile("misc/entryWithJWT.csv", data, (err) => {
        if (err)
            console.log(err);
        else {
            console.log("File written successfully\n");
        }
    });
};

const generateJWT = (firstName: String, lastName: String, email: String) => {
    return jwt.sign({
            firstName: firstName,
            lastName: lastName,
            email: email,
            category: "masseyhacks"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "5000h",
        }
    );
};

createNewCSV("misc/entry.csv");

