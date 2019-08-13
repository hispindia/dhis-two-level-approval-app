exports.DHIS_URL_BASE = "https://uphmis.in/uphmis";
exports.username = "admin";
exports.password = "";

exports.program_doc_diary = "Bv3DaiOd5Ai";
exports.root_ou = "v8EzhiynNtf";
exports.attr_user = "fXG73s6W4ER";


exports.views = {
    login : "login",
    calendar : "calendar",
    entry : "entry",
    loading : "loader",
    settings: "settings"
};

exports.approval_status = {

    approved : "Approved",
    autoapproved : "Auto-Approved",
    rejected : "Rejected",
    resubmitted : "Re-submitted",
    pending2 : "Pending2",
    pending1 : "Pending1"
    
}

exports.approval_usergroup_level2_code="approval2ndlevel";
exports.approval_usergroup_level1_code="approval1stlevel";

exports.report_types = {

    approved: "approved",
    pending:"pending",
    rejected : "rejected"
}

exports.approval_status_de = "W3RxC0UOsGY";
exports.approval_rejection_reason_de = "CCNnr8s3rgE";
exports.query_ddReport = function(){

    return `
select 
tei,
max(ou.uid) as ouuid,
array_agg(distinct concat(tea.uid,':',teav.value)) as attrlist,
array_agg(distinct concat(de,':',devalue)) as delist
from trackedentityattributevalue teav
inner join (
	select tei.organisationunitid,pi.trackedentityinstanceid as tei,de.uid as de,sum(tedv.value::float8) as devalue
	from programstageinstance psi
	inner join programinstance pi on pi.programinstanceid = psi.programinstanceid
	inner join trackedentitydatavalue tedv on tedv.programstageinstanceid = psi.programstageinstanceid
	inner join dataelement de on de.dataelementid = tedv.dataelementid
	inner join trackedentityinstance tei on tei.trackedentityinstanceid = pi.trackedentityinstanceid
	where tedv.value ~ '^-?[0-9]+\.?[0-9]*$' and tedv.value !='0'
	and de.valuetype = 'NUMBER'
	and psi.executiondate between '2017-01-01' and '2019-06-01'
	and psi.programstageid in (select programstageid 
								from programstage 
								where uid = 'CLoZpOqTSI8')
	and tei.organisationunitid in (select organisationunitid 
									from organisationunit 
									where path like '%SpddBmmfvPr%')
	group by pi.trackedentityinstanceid,de.uid,tei.organisationunitid
)tedv
on teav.trackedentityinstanceid = tedv.tei
inner join trackedentityattribute tea on tea.trackedentityattributeid = teav.trackedentityattributeid
inner join organisationunit ou on ou.organisationunitid = tedv.organisationunitid
group by tedv.tei
order by tei


`

}
exports.query_teiWiseAttrValue = function(teis){

    
    return `select json_agg(attrvalues) as attrvals
        from(
	    select json_build_object(
                'tei',tei.uid,'attrs',
	        json_agg(
	            json_build_object(
			'attr' , tea.uid,
			'value' , teav.value
		        
		    )
	        )) as attrvalues

	    from trackedentityattributevalue teav
	    inner join trackedentityinstance tei on tei.trackedentityinstanceid = teav.trackedentityinstanceid
	    inner join trackedentityattribute tea on tea.trackedentityattributeid = teav.trackedentityattributeid
	    where tei.uid in (${teis} )	
	    group by tei.uid
        )endofQ`
}

exports.cache_curr_user = "dd_current_user";
exports.cache_user_prefix = "dd_user_";
exports.cache_program_metadata = "dd_program_metadata";

exports.disabled_fields = [
    'OZUfNtngt0T',
    'CCNnr8s3rgE'
];

exports.required_fields = [
    'x2uDVEGfY4K'
]

exports.query_jsonize = function(q){
    return `select json_agg(main.*) from (
            ${q}
            
        )main`;
}