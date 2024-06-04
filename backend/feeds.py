feeds = [
    {
        'name':'economist_finance_economics',
        'config':{
            'namespace':['all'],
            'lang':'en',
            'url':"https://www.economist.com/finance-and-economics/rss.xml",
            'content_html_selectors':['div.article__body p','article  p[data-component="paragraph"]'],
            'attribution':'The Economist',
            'date_format':"%a, %d %b %Y %H:%M:%S %z",
        }
    },
    {
        'name':'economist_business',
        'config':{
            'namespace':['all'],
            'lang':'en',
            'url':"https://www.economist.com/business/rss.xml",
            'content_html_selectors':['div.article__body p','article  p[data-component="paragraph"]'],
            'attribution':'The Economist',
            'date_format':"%a, %d %b %Y %H:%M:%S %z",
        }
    },
    {
        'name':'marketwatch',
        'config':{
            'namespace':['all'],
            'lang':'en',
            'url':"https://feeds.content.dowjones.io/public/rss/mw_bulletins",
            'content_html_selectors':['div.article__body p'],
            'attribution':'Marketwatch',
            'date_format':"%a, %d %b %Y %H:%M:%S %Z"
        }
    },
    {
        'name':'bbc_business',
        'config':{
            'namespace':['all'],
            'lang':'en',
            'url':"https://feeds.bbci.co.uk/news/business/rss.xml",
            'content_html_selectors':['article > div[data-component="text-block"]'],
            'attribution':'BBC',
            'date_format':"%a, %d %b %Y %H:%M:%S %Z"
        }
    },
    {
        'name':'bbc_technology',
        'config':{
            'namespace':['all'],
            'lang':'en',
            'url':"https://feeds.bbci.co.uk/news/technology/rss.xml",
            'content_html_selectors':['article > div[data-component="text-block"]'],
            'attribution':'BBC',
            'date_format':"%a, %d %b %Y %H:%M:%S %Z"
        }
    },
    {
        'name':'france_24_économie_technologie',
        'config':{
            'namespace':['all'],
            'lang':'fr',
            'url':"https://www.france24.com/fr/éco-tech/rss",
            'content_html_selectors':["p.t-content__chapo,div.t-content__body > p"],
            'attribution':'France24',
            'date_format':"%a, %d %b %Y %H:%M:%S %Z"
        }
    }
    # {
    #     'name':'nasdaq_original',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/nasdaq-original/rss.xml",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_commodities',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=Commodities",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_etfs',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=ETFs",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_ipos',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=IPOs",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_options',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=Options",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_stocks',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=Stocks",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_earnings',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=Earnings",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_dividends',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=Dividends",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_crypto',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=Cryptocurrencies",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
    # {
    #     'name':'nasdaq_markets',
    #     'config':{
    #         'namespace':['all'],
    #         'lang':'en',
    #         'url':"https://www.nasdaq.com/feed/rssoutbound?category=Markets",
    #         'content_html_selectors':['div.body__content > p','article div.syndicated-article-body div[class*="text-passage"] > p'],
    #         'attribution':'Nasdaq',
    #         'date_format':"%a, %d %b %Y %H:%M:%S %z",
    #         'custom_fields':['nasdaq_tickers']
    #     }
    # },
]