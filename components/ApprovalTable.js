import React,{propTypes} from 'react';
import api from '../dhis2API';
import constants from '../constants'


export function ApprovalTable(props){
    
    var instance = Object.create(React.Component.prototype);
    instance.props = props;
    
    var state = {
        user : props.user,
        program : props.program,
        rawData:props.rawData,
        sdate : props.sdate,
        edate:props.edate,
        selectedOU:props.selectedOU,
        selectedSpeciality : props.selectedSpeciality,
        ous : props.ous,
        callMeWhenInPain : props.callMeWhenInPain,
        userAuthority : props.userAuthority
    };

    var programStageMap = state.program.programStages.reduce(function(map,obj){
        map[obj.id] = obj;
        return map;
    },[]);


    var ouMap = state.ous.reduce(function(map,obj){
        map[obj.id] = obj;
        return map;
    },[]);
    
    var selectedStage = programStageMap[state.selectedSpeciality];
    
    instance.render = render;
    return instance;
    
    function getHeader(){
        var list = [];
        list.push(<th className="approval_normal" key="h_name of specilist">Name of Specialist</th>);
        list.push(<th className="approval_wide"  key="h_ou">Org Unit</th>);
        
        selectedStage.
            programStageDataElements.
            reduce(function(list,obj){
                if (obj.displayInReports){
                    list.push(<th className={obj.valueType != "TEXT"?"approval_nonText":""} key={obj.id}>{obj.dataElement.formName}</th>)
                }
                return list;
            },list);

        return list;
    }

    function getRows(){
        
        return state.rawData.reduce(function(list,data){
            var dvMap = data.delist.reduce(function(map,obj){
                map[obj.split(":")[0]] = obj.split(":")[1];
                return map;                
            },[]);

            var attrMap = data.attrlist.reduce(function(map,obj){
                map[obj.split(":")[0]] = obj.split(":")[1];
                return map;                
            },[]);

            var _list = [];
            _list.push(<td className="approval_normal" key="d_name of specilist">{attrMap["U0jQjrOkFjR"]}</td>);
            _list.push(<td className="approval_wide" key="d_ou">{makeFacilityStrBelowLevel(ouMap[data.ouuid],2)}</td>);
            
            selectedStage.
                programStageDataElements.
                reduce(function(_list,obj){
                    if (obj.displayInReports){
                        _list.push(<td className={obj.valueType != "TEXT"?"approval_nonText":""}  key={"d"+obj.id+data.tei}>{dvMap[obj.dataElement.id]}</td>)
                    }
                    return _list;
                },_list);

            list.push([<tr key={data.tei}>{_list}</tr>]);
            return list;
        },[]);
       
    }
    
    function makeFacilityStrBelowLevel(ou,level){        
        return ou.ancestors.reduce(function(str,obj){
            if(obj.level>level){
                str = str + obj.name + " / " ;
            }
            return str;
        },"")  + ou.name;                
    }
    
    function render(){
        return ( 
                <div>
                <h5> Record List </h5>

                <table className="approvalTable">
                
            </table>

                <table className="approvalTable">
                <thead>
                <tr>
                <th colSpan="3">Org Unit:{state.selectedOU.name}</th>
                <th colSpan={selectedStage.programStageDataElements.length}>{state.sdate} -  {state.edate}</th>

            </tr>
                <tr>
                
                <th colSpan={  selectedStage.programStageDataElements.length+1 + 3}>{selectedStage.name}</th>
                </tr>
                <tr>
                {getHeader()}
            </tr>
                </thead>

                <tbody>
                
            {getRows()}
            </tbody>
                </table>
        
            </div>
        )
    }
    
}

