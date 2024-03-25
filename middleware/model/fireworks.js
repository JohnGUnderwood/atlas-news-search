import OpenAI from 'openai';
import { createRouter } from 'next-connect';

class Model {
    constructor(apiKey){
        this.apiKey = apiKey
        try{
            this.model = new OpenAI({apiKey:apiKey,baseURL:"https://api.fireworks.ai/inference/v1"});
        }catch(error){
            console.log(`Connection failed ${error}`)
            throw error;
        }
    }

    embed = async function(string){
        try{
            const resp = await this.model.embeddings.create({
                model:"nomic-ai/nomic-embed-text-v1.5",
                input:`search_query: ${string}`,
                encoding_format:"float",
                dimensions:process.env.EMBEDDING_DIMENSIONS? process.env.EMBEDDING_DIMENSIONS:768
              })
            return resp.data[0].embedding;
        }catch(error){
            console.log(`Failed to create embeddings ${error}`)
            throw error;
        }
    }
}

async function middleware(req, res, next) {
    // req.model = await get();
    const model = new Model(process.env.FIREWORKS_API_KEY);
    req.model = model;
    return next();
}
  
const openai = createRouter();
openai.use(middleware);
  
export default openai;