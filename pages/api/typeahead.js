import { createRouter } from 'next-connect';
import database from '../../middleware/database';
import { languages } from '../config.mjs'

async function getResults(collection,pipeline){
    try{
        const results = await collection.aggregate(pipeline).toArray();
        return results;
    }catch(error){
        throw error
    }
}

const router = createRouter();

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
        
        var searchOpts = {
            index:"searchIndex",
            compound:{
                should:[],
                filter:[]
            },
        }

        for( const lang of languages){
            searchOpts.compound.should.push(
                {
                    autocomplete:{
                        query:req.query.q,
                        path: `title.${lang}`
                    }
                }
            )
        }

        if(req.body.filters && Object.keys(req.body.filters).length > 0){
            for (const [field, filter] of Object.entries(req.body.filters)){

                if(filter.type == "equals"){
                    const opt = {
                        equals: {
                            path: field,
                            value: filter.val
                        }
                    }
                    searchOpts.compound.filter.push(opt);
                }
            }
        }
        const pipeline = [
            {
                $search:searchOpts
            },
            {
                $limit: req.query.pageSize ? req.query.pageSize : 4
            },
            {
                $project:{
                  title:1,
                  lang:1
                }
            }
        ]
        try{
            const response = await getResults(req.collection,pipeline);
            res.status(200).json({results:response,query:pipeline});
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();