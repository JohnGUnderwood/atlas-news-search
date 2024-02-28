import { createRouter } from 'next-connect';
import database from '../../middleware/database';
import schema from '../../config.mjs'

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
    if(!req.query.q){
        console.log(`Request missing 'q' param`)
        res.status(400).send(`Request missing 'q' param`);
    }else{
        const textOp = {
            text:{
                  query:req.query.q,
                  path: [
                    { "wildcard": `${schema.titleField}.*` },
                    { "wildcard": `${schema.descriptionField}.*` },
                    { "wildcard": `${schema.contentField}.*` }
                  ],
                  fuzzy:{
                    maxEdits:1,
                    maxExpansions:10
                  },
              }
        }

        var searchOpts = {
            index:"searchIndex",
            compound:{
                must:[textOp],
                filter:[]
            },
            highlight:{
                path:[
                    {wildcard:`${schema.descriptionField}.*`},
                    {wildcard:`${schema.contentField}.*`}
                ]
            }
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
                $searchMeta: {
                    index:"searchIndex",
                    count: {type:"total"},
                    facet: {
                        operator: {
                            compound: searchOpts.compound
                        },
                        facets:{
                            attribution:{
                                type:"string",
                                path:"attribution"
                            },
                            lang: {
                                type:"string",
                                path:"lang"
                            },
                            authors: {
                                type:"string",
                                path:"authors"
                            },
                            tags: {
                                type:"string",
                                path:"tags"
                            }
                            // Date: {
                            //     type:"date",
                            //     path:"published",
    
                            // }
                        }
                    }
                }
            }
        ]
        try{
            const meta = await getResults(req.collection,pipeline);
            const hits = meta[0].count.total;
            res.status(200).json({facets:meta[0].facet,query:pipeline,hits:hits});
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();