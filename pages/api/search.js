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
      
        if(req.query.page == 'next' && req.query.pageToken){
          searchOpts.searchAfter = req.query.pageToken
        }else if(req.query.page == 'prev' && req.query.pageToken){
          searchOpts.searchBefore = req.query.pageToken
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
                  title:`$${schema.titleField}`,
                  image:`$${schema.imageField}`,
                  description:`$${schema.descriptionField}`,
                  highlights: { $meta: "searchHighlights" },
                  score:{$meta:"searchScore"},
                  paginationToken: {$meta: 'searchSequenceToken'},
                  lang:1,
                  attribution:1
                }
            }
        ]

        const metaPipeline = [
            {
                $searchMeta: {
                    index:"searchIndex",
                    count: {type:"total"},
                    facet: {
                        operator: {
                            compound: searchOpts.compound
                        },
                        facets:{
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
            const response = await getResults(req.collection,pipeline);
            if(req.query.page == 'prev' && req.query.pageToken){
                res.status(200).json({results:response.reverse(),query:pipeline});
            }else{
                res.status(200).json({results:response,query:pipeline});
            }
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();