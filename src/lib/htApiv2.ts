import axios, { AxiosResponse } from "axios";
import 'dotenv/config'
import fs from 'fs';

const htApiUserId = process.env.PLAY_HT_USER_ID;
const htApiSecretKey = process.env.PLAY_HT_SECRET_KEY;


export async function textToSpeech1(text: string): Promise<string> {
    if (!htApiUserId || !htApiSecretKey) {
        throw new Error("Play.ht API credentials not set.");
    }

    const data = {
        text: text,
        voice: "s3://mockingbird-prod/hanson_high_fid_v1_f2a9c3d2-aff9-4a41-9071-a9747b51e9e3/voices/speaker/manifest.json"
    };

    const response: AxiosResponse = await axios({
        method: 'post',
        url: 'https://play.ht/api/v2/tts',
        headers: {
            'AUTHORIZATION': 'Bearer ' + htApiSecretKey,
            'X-USER-ID': htApiUserId,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: data
    });

    const downloadUrl = response.data.id;

    const response1: AxiosResponse = await axios({
        method: 'GET',
        url: 'https://play.ht/api/v2/tts/' + downloadUrl,
        params: { format: 'audio-mpeg' },
        responseType: 'stream',
        headers: {
            accept: 'audio/mpeg',
            'AUTHORIZATION': 'Bearer ' + htApiSecretKey,
            'X-USER-ID': htApiUserId,
        }
    });

    const transcriptPath = `./tmp/ht-${response1.data.id}.mp3`;

    const writer = fs.createWriteStream(transcriptPath);

    response1.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return transcriptPath;
}