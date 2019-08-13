import React,{propTypes} from 'react';
import api from '../dhis2API';
import {ApprovalTable} from './ApprovalTable';
import constants from '../constants';
import moment from 'moment';

export function ApprovalI(props){
    
    var instance = Object.create(React.Component.prototype);
    instance.props = props;
    
    var state = {

        program : props.data.program,
        user : props.data.user,
        selectedOU : {name : ""},
        orgUnitValidation : "",
        specialityValidation : "",
        ouMode : "DESCENDANTS",
        sdate : moment().subtract(1,'months').startOf('month').format("YYYY-MM-DD"),
        edate : moment().subtract(1,'months').endOf('month').format("YYYY-MM-DD"),
        selectedSpeciality : "-1",
        events : null,
        teiWiseAttrVals : null,
        ous : []
    };

    
    props.services.ouSelectCallback.selected = function(ou){

        state.selectedOU = ou;
        state.orgUnitValidation = ""
        instance.setState(state);
    }
    
    instance.render = render;
    return instance;

    function onSpecialityChange(e){
        state.selectedSpeciality = e.target.value;
        state.specialityValidation = ""

        instance.setState(state);
    }

    function onOuModeChange(e){
        state.ouMode = e.target.value;
        instance.setState(state);
    }

    function onStartDateChange(e){
        state.sdate = e.target.value;
        instance.setState(state);
    }

    function onEndDateChange(e){
        state.edate = e.target.value;
        instance.setState(state);
    }

    function onTypeChange(e){
        state.type = e.target.value;
        instance.setState(state);
        
    }

    function callMeWhenInPain(){
        getApprovalEvents();
    }

    function validate(){
        if (state.selectedOU.id == undefined){
            state.orgUnitValidation = "Please select Facility form left bar"
            instance.setState(state);
            return false;
        }

        if (state.selectedSpeciality == "-1"){
            state.specialityValidation = "Please select Speciality"
            instance.setState(state);
            return false;
        }
        
        return true;
    }

    
    function getData(e){

        // validation
        if (!validate()){
            return;
        }
        
        state.teiWiseAttrVals = null;
        state.events = null;
        state.loading=true;
        instance.setState(state);

        var Q = makeQuery();
        Q = constants.query_jsonize(Q);
        var sqlViewService = new api.sqlViewService();
        
        console.log(Q)
        sqlViewService.dip("DOC_DIARY_REPORT_",
                           Q,makeReport);
        
        function makeReport(error,response,body){

            if (error){
                alert("An unexpected error happenned. Please check your network connection and try again.");
                return;
            }
            
            state.rawData = JSON.parse(body.listGrid.rows[0][0].value);
            getOUWithHierarchy(function(error,response,body){
                if (error){
                    alert("An unexpected error happenned. Please check your network connection and try again.");
                    return;
                }

                state.ous = body.organisationUnits;
                instance.setState(state);            
                
            });
        }
        
        function makeQuery(){
            return constants.query_ddReport();  
        }
        
        function getOUWithHierarchy(callback){
            
            var ous = state.rawData.reduce(function(list,obj){
                if (!list.includes(obj.ouuid)){
                    list.push(obj.ouuid)
                }
                return list;
            },[]);

            
            ous = ous.reduce(function(str,obj){
                if (!str){
                    str =  "" + obj + ""
                }else{
                    str = str + "," + obj + ""
                }
                
                return str; 
            },null);

            var apiWrapper = new api.wrapper();
            var url = `organisationUnits.json?filter=id:in:[${ous}]&fields=id,name,ancestors[id,name,level]&paging=false`;
            
            apiWrapper.getObj(url,callback)
        }
        
    }
    
    
    
    function render(){        
        
        function getApprovalTable(){
            
            if(!(state.rawData)){
                return (<div></div>)
            }        
            return (<ApprovalTable key="approvaltable"  rawData={state.rawData} selectedOU={state.selectedOU} sdate={state.sdate} edate={state.edate} program={state.program} user={state.user}  selectedSpeciality={state.selectedSpeciality} ous={state.ous} type={state.type} callMeWhenInPain={callMeWhenInPain} />
                   );
            
        }
        
        function getSpeciality(program){
            
            var options = [
                    <option disabled key="select_speciality" value="-1"> -- Select -- </option>
            ];
            
            program.programStages.forEach(function(ps){
                options.push(<option key = {ps.id}  value={ps.id} >{ps.name}</option>);
            });
            
            return options;
        }
        
        return ( 
                <div>
                <h3> Doc Diary Reports  </h3>
                
                <table className="formX">
                <tbody>
                <tr>
                <td>  Select Speciality<span style={{"color":"red"}}> * </span> : </td><td><select  value={state.selectedSpeciality} onChange={onSpecialityChange} id="report">{getSpeciality(props.data.program)}</select><br></br> <label key="specialityValidation" ><i>{state.specialityValidation}</i></label>
                </td>
                <td className="leftM">  Selected Facility<span style={{"color":"red"}}> * </span>  : </td><td><input disabled  value={state.selectedOU.name}></input><br></br><label key="orgUnitValidation" ><i>{state.orgUnitValidation}</i></label></td>
                
            </tr>
                <tr>
                <td> Select Start Period<span style={{"color":"red"}}> * </span>  :  </td><td><input type="date" value={state.sdate} onChange = {onStartDateChange} ></input><br></br><label key="startPeValidation" ><i>{}</i></label>
                </td>
                <td className="leftM" > Select End Period<span style={{"color":"red"}}> * </span>  : </td><td><input type="date" value={state.edate} onChange = {onEndDateChange} ></input><br></br><label key="startPeValidation" ><i>{}</i></label>
                </td>
                <td></td>
                </tr>
                <tr>
                <td className="" > Select OU Mode : </td><td><select  value = { state.ouMode  }  id="ouMode" onChange = {onOuModeChange}> <option key="selected"  value="SELECTED" > Selected </option> <option key="descendants" value="DESCENDANTS" > Descendants </option> </select></td>

                <td className="leftM" > Select Type : </td><td><select  value = { state.type  }  id="type" onChange = {onTypeChange}>
                <option key="rejected"  value={constants.report_types.rejected} > Rejected </option>
                <option key="application_for_approval"  value={constants.report_types.pending} > Application for Approval </option>
                <option key="approved"  value={constants.report_types.approved} > Approved  </option>
                
            </select></td>
                
            </tr>
                <tr></tr><tr></tr>
                <tr><td>  <input type="submit" value="Submit" onClick={getData} ></input></td>
                <td> <img style = {state.loading?{"display":"inline"} : {"display" : "none"}} src="./images/loader-circle.GIF" alt="loader.." height="32" width="32"></img>  </td></tr>

            </tbody>                
                </table>
                {
                    getApprovalTable()
                }
            
            </div>
        )
    }

}

