import styles from "./form.module.css";
import { Label } from "@leafygreen-ui/typography";
import TextInput from '@leafygreen-ui/text-input';
import Icon from "@leafygreen-ui/icon";

export default function Form({formData,setFormData}){
    const handleInputChange = (attribute, event, index=null) => {
        
        if(attribute === 'content_html_selectors'){
            setFormData({
                ...formData, 
                content_html_selectors: formData.content_html_selectors.map(
                    (value, i) => i === index ? event.target.value : value)
            });
        }else {
            setFormData({
                ...formData,
                [attribute]: event.target.value
            });
        }
            
    };

    const handleAddClick = () => {
        setFormData({
            ...formData, 
            content_html_selectors: formData.content_html_selectors.concat([''])
        });
    };

    const handleRemoveClick = () => {
        setFormData({
            ...formData, 
            content_html_selectors: formData.content_html_selectors.slice(0, formData.content_html_selectors.length - 1)
        });
    };

    return (
        <>
        <div className={styles.formRow}>
                <Label htmlFor="_id">ID:</Label>
                <TextInput
                    className={styles.formInput}
                    value={formData._id}
                    type="text" id="_id" name="_id" required
                    onChange={event => handleInputChange('_id',event)}/>
                <div className={styles.spacer}></div>
            </div>
            <div className={styles.formRow}>
                <Label htmlFor="lang">Language:</Label>
                <TextInput
                    className={styles.formInput}
                    value={formData.lang}
                    type="text" id="lang" name="lang" required
                    onChange={event => handleInputChange('lang',event)}/>
                <div className={styles.spacer}></div>
            </div>
            <div className={styles.formRow}>
                <Label htmlFor="url">RSS URL:</Label>
                <TextInput
                    className={styles.formInput}
                    value={formData.url}
                    type="text" id="url" name="url" required
                    onChange={event => handleInputChange('url',event)}/>
                <div className={styles.spacer}></div>
            </div>
            <div className={styles.formRow}>
                <Label htmlFor="attribution">Attribution:</Label>
                <TextInput
                    className={styles.formInput}
                    value={formData.attribution}
                    type="text" id="attribution" name="attribution" required
                    onChange={event => handleInputChange('attribution',event)}/>
                <div className={styles.spacer}></div>
            </div>
            <div className={styles.formRow}>
                <Label htmlFor="date_format"><a target="_blank" href="https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes">Datetime Format</a>:</Label>
                <TextInput
                    className={styles.formInput}
                    value={formData.date_format}
                    type="text" id="date_formatn" name="date_format" required
                    onChange={event => handleInputChange('date_format',event)}/>
                <div className={styles.spacer}></div>
            </div>
            {formData.content_html_selectors.map((selector, index) => (
                <div className={styles.formRow} key={index}>
                    <Label htmlFor={`content_html_selector_${index}`}>Content HTML Selector:</Label>
                    <TextInput
                        className={styles.formInput}
                        type="text"
                        id={`content_html_selector_${index}`}
                        name={`content_html_selector_${index}`}
                        value={selector}
                        onChange={event => handleInputChange('content_html_selectors',event,index)}
                        required
                    />
                    {index === formData.content_html_selectors.length - 1 ? (
                        <div className={styles.iconContainer}>
                            <Icon onClick={handleAddClick} glyph={"PlusWithCircle"} fill="#C1C7C6" />
                            {formData.content_html_selectors.length > 1 ? (
                                <Icon onClick={handleRemoveClick} glyph={"XWithCircle"} fill="#C1C7C6" />
                            ):<div style={{width:"16px"}}></div>}
                        </div>
                    ):<div className={styles.spacer}></div>}
                </div>
            ))}
        </>
    )
}