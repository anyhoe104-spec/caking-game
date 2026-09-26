import CakeModel from './CakeModel.jsx';

export default function CraftStage({ kind, recipe, cakeStyle }) {
  return <div className={`craftStation craftStation--${kind}`} aria-hidden="true">
    <div className="stationTable" />
    {kind === 'oven' && <div className="stationOven"><span/><i/><i/></div>}
    {kind === 'steam' && <><div className="stationBath"><span/><span/><span/></div><div className="stationSteam"><i/><i/><i/></div></>}
    {kind === 'whisk' && <><div className="stationBowl"/><div className="stationWhisk"/><div className="stationFlour"><i/><i/><i/></div></>}
    {(kind === 'roll' || kind === 'fold') && <><div className="stationDough"/><div className="stationRollingPin"/>{kind === 'fold' && <div className="stationFold"/>}</>}
    {['layer','decorate','glaze','cool'].includes(kind) && <div className="stationCake"><CakeModel style={cakeStyle} recipe={recipe}/></div>}
    {kind === 'layer' && <div className="stationLayer"/>}
    {kind === 'decorate' && <div className="stationPiping"/>}
    {kind === 'glaze' && <div className="stationGlaze"/>}
    {kind === 'cool' && <div className="stationCool"><i/><i/><i/></div>}
  </div>;
}
