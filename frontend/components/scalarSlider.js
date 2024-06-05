import { Label } from "@leafygreen-ui/typography"
export default function ScalarSlider({query,handleSliderChange}){
    const param = "scalar"
    const val = query.scalar.vector
    return (
        <div style={{justifyContent:"center",display:'flex'}} >
            <Label style={{ marginRight: '10px' }}>Lexical Search Weight ({query.scalar.fts})</Label>
            <input
                key={param}
                style={{width:'20vw'}}
                type="range"
                min={0.1} 
                max={0.9}
                step={0.1} 
                value={val} 
                onChange={(e) => handleSliderChange(e.target.value)}
            />
            <Label style={{ marginLeft: '10px' }}>Semantic Search Weight ({query.scalar.vector})</Label>
        </div>
    )
}