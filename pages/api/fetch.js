import { createRouter } from 'next-connect';
import database from '../../middleware/database';

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

router.post(async (req, res) => {
    const pipeline = [
        {
            $search: {
                index:"searchIndex",
                compound:{
                    must:[
                        {
                            text:{
                                query:req.body.query,
                                path: {wildcard:`${req.body.field}.*`}
                            }
                        }
                    ],
                    filter:[
                        {
                            equals:{
                                path:'_id',
                                value:req.body.id
                            }
                        }
                    ]
                }
                ,
                highlight:{
                    path:[
                        {wildcard:`${req.body.field}.*`}
                    ],
                    maxNumPassages: 25
                },
            }
        },
        {$limit:1}
    ]
    try{
        const response = await getResults(req.collection,pipeline);
        res.status(200).json(response[0]);
    }catch(error){
        res.status(405).json({'error':`${error}`});
    }
});

export default router.handler();