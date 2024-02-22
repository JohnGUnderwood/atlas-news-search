feeds = [
    {
        '_id':'france_24_en',
        'lang':'en',
        'url':"https://www.france24.com/en/rss",
        'interval':1,
        'unit':'minutes',
        'date_format':'%a, %d %b %Y %H:%M:%S %Z',
        'content_html_selector':"p.t-content__chapo,div.t-content__body > p",
        'attribution':{'text':'France24','image_src':'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEUAqeQApuQKruYbs+jp9/256Ph+0/HQ7/o5vev///9ky++n4vZNw+35/f+V2/QAoeIquOmu19w/AAABoUlEQVR4Aa2Ri45kIQhEKQQFUfH/v3ZXpx8zm94858SkO7cqJwHod8Dl/DkP592PrwIzEzNATPeBCogLP2KwiFZpCvMOqTWKeIzZlPEozFW6jFnqVBLRCC21++p4G+rwGZAQa+pLV47u8S54z956GzPmakNiTGndNfjRIOPkTcMsyzbeO60TjzHoSY6ITomsYXnHTCAzX3l1nx7I5d7zw5pIfJhP6i7/KcTK4c28x4fCIXHkrVnzxfigKM3bhrj7/KiA+mzaYi05RXodCk/BnNPdd6YeAXCudyr87JULEZVN4G1mYywD7UpfjctVZxlWzm/qSspY+XNejH7CxFa9C6r5My+yiYtV1Q5kkUb4lhuDVlPVqIZMXh74luc4uiTmeyaL2SwJ+dJnlXKiBO2uImEJSo5HfsZTl6bamkhbgxJIri6P/O5n97pW7cZfpr3mrHTJrokz/QvaVVw65WO87bopLyC2ruIShjzh2S0wxOVcK7SJ+2x103Em7Pg3CLAa7S8adRTKmyb35kS57j7zDUAAeMR0WcfgA/QPpYe466D8AzOtE5QdlSHhAAAAAElFTkSuQmCC'}
    },
    {
        '_id':'france_24_fr',
        'lang':'fr',
        'url':"https://www.france24.com/fr/rss",
        'interval':1,
        'unit':'minutes',
        'date_format':'%a, %d %b %Y %H:%M:%S %Z',
        'content_html_selector':"p.t-content__chapo,div.t-content__body > p",
        'attribution':{'text':'France24','image_src':'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEUAqeQApuQKruYbs+jp9/256Ph+0/HQ7/o5vev///9ky++n4vZNw+35/f+V2/QAoeIquOmu19w/AAABoUlEQVR4Aa2Ri45kIQhEKQQFUfH/v3ZXpx8zm94858SkO7cqJwHod8Dl/DkP592PrwIzEzNATPeBCogLP2KwiFZpCvMOqTWKeIzZlPEozFW6jFnqVBLRCC21++p4G+rwGZAQa+pLV47u8S54z956GzPmakNiTGndNfjRIOPkTcMsyzbeO60TjzHoSY6ITomsYXnHTCAzX3l1nx7I5d7zw5pIfJhP6i7/KcTK4c28x4fCIXHkrVnzxfigKM3bhrj7/KiA+mzaYi05RXodCk/BnNPdd6YeAXCudyr87JULEZVN4G1mYywD7UpfjctVZxlWzm/qSspY+XNejH7CxFa9C6r5My+yiYtV1Q5kkUb4lhuDVlPVqIZMXh74luc4uiTmeyaL2SwJ+dJnlXKiBO2uImEJSo5HfsZTl6bamkhbgxJIri6P/O5n97pW7cZfpr3mrHTJrokz/QvaVVw65WO87bopLyC2ruIShjzh2S0wxOVcK7SJ+2x103Em7Pg3CLAa7S8adRTKmyb35kS57j7zDUAAeMR0WcfgA/QPpYe466D8AzOtE5QdlSHhAAAAAElFTkSuQmCC'}
    },
    {
        '_id':'france_24_es',
        'lang':'es',
        'url':"https://www.france24.com/es/rss",
        'interval':1,
        'unit':'minutes',
        'date_format':'%a, %d %b %Y %H:%M:%S %Z',
        'content_html_selector':"p.t-content__chapo,div.t-content__body > p",
        'attribution':{'text':'France24','image_src':'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEUAqeQApuQKruYbs+jp9/256Ph+0/HQ7/o5vev///9ky++n4vZNw+35/f+V2/QAoeIquOmu19w/AAABoUlEQVR4Aa2Ri45kIQhEKQQFUfH/v3ZXpx8zm94858SkO7cqJwHod8Dl/DkP592PrwIzEzNATPeBCogLP2KwiFZpCvMOqTWKeIzZlPEozFW6jFnqVBLRCC21++p4G+rwGZAQa+pLV47u8S54z956GzPmakNiTGndNfjRIOPkTcMsyzbeO60TjzHoSY6ITomsYXnHTCAzX3l1nx7I5d7zw5pIfJhP6i7/KcTK4c28x4fCIXHkrVnzxfigKM3bhrj7/KiA+mzaYi05RXodCk/BnNPdd6YeAXCudyr87JULEZVN4G1mYywD7UpfjctVZxlWzm/qSspY+XNejH7CxFa9C6r5My+yiYtV1Q5kkUb4lhuDVlPVqIZMXh74luc4uiTmeyaL2SwJ+dJnlXKiBO2uImEJSo5HfsZTl6bamkhbgxJIri6P/O5n97pW7cZfpr3mrHTJrokz/QvaVVw65WO87bopLyC2ruIShjzh2S0wxOVcK7SJ+2x103Em7Pg3CLAa7S8adRTKmyb35kS57j7zDUAAeMR0WcfgA/QPpYe466D8AzOtE5QdlSHhAAAAAElFTkSuQmCC'}
    }
]