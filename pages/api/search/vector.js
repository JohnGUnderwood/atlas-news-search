import { createRouter } from 'next-connect';
import database from '../../../middleware/database';
import selectModel from '../../../middleware/selectModel';

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

router.post(async (req, res) => {
    if(!req.query.q){
        console.log(`Request missing 'q' param`)
        res.status(400).send(`Request missing 'q' param`);
    }else{
        const embedding = await req.model.embed(req.query.q);
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
                $unset:"embedding"
            },
            {
                $addFields:{
                    score:{$meta:"vectorSearchScore"}
                }
            },
            {
                $group:{
                    _id:"$parent_id",
                    chunks:{$push:"$$ROOT"},
                    lang:{$first:"$lang"},
                    title:{$first:"$title"},
                    attribution:{$first:"$attribution"},
                    max:{$max:"$score"},
                    avg:{$avg:"$score"},
                    sum:{$sum:"$score"},
                    count:{$count:{}}
                    
                }
            },
            {
                $project:{
                  parent:'$_id',
                  chunks:1,
                  lang:1,
                  attribution:1,
                  title:1,
                  score:{
                    avg:"$avg",
                    max:"$max",
                    sum:"$sum",
                    count:"$count"
                  }
                }
            },
            {
                $sort:{
                    "score.max":-1
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