import openai from './model/openai';
import mistral from './model/mistral';
import nomic from './model/nomic';
import fireworks from './model/fireworks';

function selectModel(router){
    if(process.env.PROVIDER == "azure_openai" ||  !process.env.PROVIDER){
        router.use(azure_openai);
        console.log("Using Azure OpenAI embeddings");
    }else if(process.env.PROVIDER == "openai"){
        router.use(openai);
        console.log("Using OpenAI embeddings");
    }else if(process.env.PROVIDER == "mistral"){
        router.use(mistral);
        console.log("Using Mistral embeddings");
    }else if(process.env.PROVIDER == "nomic"){
        router.use(nomic);
        console.log("Using Nomic embeddings");
    }else if(process.env.PROVIDER == "fireworks"){
        router.use(fireworks);
        console.log("Using fireworks.ai embeddings");
    }
}
export default selectModel;