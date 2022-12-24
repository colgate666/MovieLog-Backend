import { mkdir, writeFile } from "fs";
import path from "path";
import { promisify } from "util";
import { appRoot, LOG } from "..";
import { detectMimeType } from "./mimetype";

export const saveFromBase64 = async (filename: string, data?: string): Promise<string | undefined> => {
    if (!data) {
        return undefined;
    }
    
    try {
        const buffer = Buffer.from(data, "base64");
        const mimetype = detectMimeType(data);
    
        const md = promisify(mkdir);
        const wf = promisify(writeFile);
        const ip = path.join(appRoot, "public", "images", "avatars");
    
        await md(ip, { recursive: true });
        const p = path.join(ip, `${filename}.${mimetype}`); 
    
        await wf(p, buffer);
    
        return p;
    } catch (err) {
        LOG.error(err);
        return undefined;
    }
}