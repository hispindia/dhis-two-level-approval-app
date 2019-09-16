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
        selectedOU : props.data.user.organisationUnits[0],
        orgUnitValidation : "",
        specialityValidation : "",
        ouMode : "DESCENDANTS",
        sdate : moment().subtract(1,'months').startOf('month').format("YYYY-MM-DD"),
        edate : moment().subtract(1,'months').endOf('month').format("YYYY-MM-DD"),
        selectedSpeciality : "-1",
        events : null,
        teiWiseAttrVals : null,
        ous : [],
        type : constants.report_types.pending,
        userAuthority : getUserAuthority(props.data.user)
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
        if ((Date.parse(state.sdate) >= Date.parse(state.edate))) {
            alert("End date should be greater than Start date");
        }
        else{
            instance.setState(state);
        }

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
        if ((Date.parse(state.sdate) >= Date.parse(state.edate))) {
            alert("End date should be greater than Start date");
            return false;
        }
        
        return true;
    }

    
    function getApprovalEvents(e){

        // validation
        if (!validate()){
            return;
        }
        
        state.teiWiseAttrVals = null;
        state.events = null;
        state.loading=true;
        instance.setState(state);

        
     
        fetchEventGrid(function(eventuids){
            if (!eventuids){
                alert("No Data Found");
                state.loading=false;
                instance.setState(state);
                return
            }
            fetchEvents(eventuids)

        });
        
        
        function fetchEvents(eventuids){
            
            var url = `events?paging=false&order=orgUnitName:asc&event=${eventuids}`;

            var apiWrapper = new api.wrapper();
            apiWrapper.getObj(url,function(error,body,response){
                if (error){
                    alert("An unexpected error occurred." + error);
                    return;
                }

                var events = response.events;
                state.events = events;

                getTEIFromEvents(events,function(error,body,response){
                    if (error){

                    }

                    var attrVals = JSON.parse(response.
                                              listGrid.
                                              rows[0][0]?response.
                                              listGrid.
                                              rows[0][0].value:null);
                    
                    state.teiWiseAttrVals = attrVals;

                    getOuFromEvent(events,function(error,response,body){
                        if (error){
                            
                        }
                        
                        state.ous = body.organisationUnits;
                        state.loading=false;
                        instance.setState(state)
                    })
                    
                })
                
            })

        }
        
        function fetchEventGrid(callback){
            var url = `events/query?program=${constants.program_doc_diary}&startDate=${state.sdate}&endDate=${state.edate}&orgUnit=${state.selectedOU.id}&ouMode=${state.ouMode}&programStage=${state.selectedSpeciality}&skipPaging=true`;

            switch(state.type){
            case constants.report_types.approved :
                url = `${url}&status=COMPLETED&filter=${constants.approval_status_de}:IN:${constants.approval_status.approved};${constants.approval_status.autoapproved}`
                break;
            case constants.report_types.pending:
                if (state.userAuthority == constants.approval_usergroup_level1_code){
                    url = `${url}&status=COMPLETED&filter=${constants.approval_status_de}:IN:${constants.approval_status.pending1};${constants.approval_status.resubmitted}`
                    
                }else{
                    url = `${url}&status=COMPLETED&filter=${constants.approval_status_de}:IN:${constants.approval_status.pending2}`                
                }
                
                break;
            case constants.report_types.rejected:
                url = `${url}&status=ACTIVE&filter=${constants.approval_status_de}:IN:${constants.approval_status.rejected}`
                break;                
            }
            
            var apiWrapper = new api.wrapper();
            apiWrapper.getObj(url,function(error,body,response){
                if (error){
                    alert("An unexpected error occurred." + error);
                    return;
                }

                var eventuids = response.rows.reduce(function(str,obj){
                    str = str + obj[0] + ";"
                    return str;
                },"")

                callback(eventuids)
                
            })
        }
        
        function getTEIFromEvents(events,callback){

            var teis = events.reduce(function(list,obj){
                if (!list.includes(obj.trackedEntityInstance)){
                    list.push(obj.trackedEntityInstance)
                }
                return list;
            },[]);

            
            teis = teis.reduce(function(str,obj){
                if (!str){
                    str =  "'" + obj + "'"
                }else{
                    str = str + ",'" + obj + "'"
                }
                
                return str; 
            },null);

            var sqlViewService = new api.sqlViewService();
            
            console.log(constants.query_teiWiseAttrValue(teis))
            sqlViewService.dip("Approval_App",
                               constants.query_teiWiseAttrValue(teis),
                               callback);
            
        }
        
        function getOuFromEvent(events,callback){
            var ous = events.reduce(function(list,obj){
                if (!list.includes(obj.orgUnit)){
                    list.push(obj.orgUnit)
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
            var url = `organisationUnits.json?filter=id:in:[${ous}]&fields=id,name,ancestors[id,name,level]`;

            apiWrapper.getObj(url,callback)

            
        }
    }

    function getUserAuthority(user){

        return user.userGroups.reduce(function(str,obj){

            if (obj.code == constants.approval_usergroup_level1_code){
                str = constants.approval_usergroup_level1_code;                
            }

            if (obj.code == constants.approval_usergroup_level2_code){
                str = constants.approval_usergroup_level2_code;                
            }
            return str;    
        },null)
        
    }

    function render(){        
        
        function getApprovalTable(){
            if (!state.userAuthority){
                return (<div>You do not have approval authority</div>)
            }
            
            if(!(state.events || state.teiWiseAttrVals)){
                return (<div></div>)
            }        
            
            return (<ApprovalTable key="approvaltable"  events={state.events} program={state.program} user={state.user} teiWiseAttrVals={state.teiWiseAttrVals} selectedSpeciality={state.selectedSpeciality} ous={state.ous} type={state.type} callMeWhenInPain={callMeWhenInPain} userAuthority={state.userAuthority}/>
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

            <div >
                <div className="card">
                <h3> Approval {state.userAuthority==constants.approval_usergroup_level1_code?"MOIC/CMS":"CMO/CMS"} </h3>
                
                <table>
                <tbody>
                <tr className="row">
                <td className="col-sm-4">  Select Speciality<span style={{"color":"red"}}> * </span> :
                 <select className="form-control" title='User Speciality in Doctor Diary'  value={state.selectedSpeciality} onChange={onSpecialityChange} id="report">{getSpeciality(props.data.program)}</select>
                  <label key="specialityValidation" className="red"><i>{state.specialityValidation}</i></label>
                </td>
                <td className="col-sm-4">  Selected Facility<span style={{"color":"red"}}> * </span>  :
                <input className="form-control" disabled  value={state.selectedOU.name} title='Facility Name'></input>
                 <label key="orgUnitValidation" className="red"><i>{state.orgUnitValidation}</i></label>
                </td>
                 <td className="col-sm-4"> Select OU Mode :
                        <select className="form-control" title='Selection Mode of Organisation Unit' value = { state.ouMode  }  id="ouMode" onChange = {onOuModeChange}>
                            <option key="selected" title="Selected Organisation Unit" value="SELECTED" > Selected </option>
                            <option key="descendants" value="DESCENDANTS" title="Children of Selected Organisation Unit"> Descendants </option>
                        </select>
                     <label ><i>&nbsp;</i></label>
                 </td>
            </tr>
                <tr className="row">
                <td className="col-sm-4"> Select Start Period<span style={{"color":"red"}}> * </span>  :
                 <input className="form-control" title='Start Date between Date of Selection' type="date" value={state.sdate} onChange = {onStartDateChange} ></input>
                  <label key="startPeValidation" className="red" ><i>{}</i></label>
                </td>
                <td  className="col-sm-4"> Select End Period<span style={{"color":"red"}}> * </span>  :
                <input className="form-control" title='End Date between Date of Selection' type="date" value={state.edate} onChange = {onEndDateChange} ></input>
                 <label key="startPeValidation" className="red"><i>{}</i></label>
                </td>
                    <td className="col-sm-4"> Select Type :
                        <select className="form-control" title='Type of Status (Pending, Approved Or Rejected)' value = { state.type  }  id="type" onChange = {onTypeChange}>
                            <option key="rejected"  value={constants.report_types.rejected} > Rejected </option>
                            <option key="application_for_approval"  value={constants.report_types.pending} > Application for Approval </option>
                            <option key="approved"  value={constants.report_types.approved} > Approved  </option>

                        </select>
                        <label ><i>&nbsp;</i></label>
                    </td>
                </tr>

                <tr className="row">
                    <td colSpan="3" className="col-sm-8"><br/></td>
                </tr>
                <tr className="row">
                    <td className="col-sm-4">  <input className= "btn btn-primary" type="submit" value="Submit" onClick={getApprovalEvents} ></input></td>
                <td className="col-sm-4" colSpan="2"> <img style = {state.loading?{"display":"inline"} : {"display" : "none"}} src="./images/loader-circle.GIF" alt="loader.." height="32" width="32"></img>  </td></tr>

                <tr className="row">
                    <td colSpan="3" className="col-sm-8"><br/></td>
                </tr>
            </tbody>                
                </table></div>
                {
                    getApprovalTable()
                }
            
            </div>
        )
    }

}

