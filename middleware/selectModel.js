import openai from './model/openai';
import azure_openai from './model/azure_openai';
import mistral from './model/mistral';
import nomic from './model/nomic';

function selectModel(router){
    if(process.env.OPENAIENDPOINT && process.env.OPENAIDEPLOYMENT && process.env.OPENAIAPIKEY){
        router.use(azure_openai);
        console.log("Using Azure OpenAI embeddings");
    }else if(process.env.OPENAIAPIKEY){
        router.use(openai);
        console.log("Using OpenAI embeddings");
    }else if(process.env.MISTRALAPIKEY){
        router.use(mistral);
        console.log("Using Mistral embeddings");
    }else if(process.env.NOMICAPIKEY){
        router.use(nomic);
        console.log("Using Nomic embeddings");
    }
}
export default selectModel;