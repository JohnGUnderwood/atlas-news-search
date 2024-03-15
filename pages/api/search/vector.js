import { createRouter } from 'next-connect';
import database from '../../../middleware/database';
import { schema } from '../../../config.mjs'
import selectModel from '../../../middleware/selectModel';
import embed from '../embed';

async function getResults(collection,pipeline){
    try{
        const results = await collection.aggregate(pipeline).toArray();
        return results;
    }catch(error){
        throw error
    }
}

const router = createRouter();
selectModel(router);
router.use(database);

// router.post(async (req, res) => {
//     if(!req.body.pipeline){
//         console.log(`Request missing 'pipeline' data`)
//         res.status(400).send(`Request missing 'pipeline' data`);
//     }else{
//         const pipeline = req.body.pipeline
//         try{
//             const response = await getResults(req.collection,pipeline);
//             res.status(200).json({results:response,query:pipeline});
//         }catch(error){
//             res.status(405).json({'error':`${error}`,query:pipeline});
//         }
//     }
// });

router.post(async (req, res) => {
    if(!req.query.q){
        console.log(`Request missing 'q' param`)
        res.status(400).send(`Request missing 'q' param`);
    }else{
        const embedding = await req.model.embed(req.query.q);
        // const embeddingResp = await axios.get('http://localhost:3020/api/embed?terms='+);
        // console.log(embedding);
        const searchOpts = {
            index:"vectorIndex",
            path:"embedding",
            queryVector: embedding,
            numCandidates:250,
            limit:50
        }
        if(req.body.filters && Object.keys(req.body.filters).length > 0){
            searchOpts.filter = {$and : []};
            for (const [field, filter] of Object.entries(req.body.filters)){

                if(filter.type == "equals"){
                    const opt = {[field]: {$eq:filter.val}}
                    searchOpts.filter.$and.push(opt);
                }
            }
        }

        const pipeline = [
            {
                $vectorSearch:searchOpts
            },
            {
                $group:{
                    _id:"$parent_id",
                    chunks:{$push:"$$ROOT"},
                    lang:{$first:"$lang"},
                    title:{$first:"$title"},
                    attribution:{$first:"$attribution"},
                }
            },
            {
                $project:{
                  parent:'$_id',
                  chunks:1,
                  lang:1,
                  attribution:1,
                  title:1,
                }
            }
        ]

        try{
            const response = await getResults(req.chunks,pipeline);
            res.status(200).json({results:response,query:pipeline});
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();