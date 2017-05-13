<%@ page import="java.util.*" %>
<%@ page import="java.sql.*" %>
<%@ page import="net.sf.json.*" %>

<%@include file="3DGIS_Constants.jsp"%>

<html>
<head>
	<meta charset="UTF-8">

	<script src="./dist/js/jquery.js"></script>
    <script src="./dist/js/bootstrap.js"></script>
    <script src="./dist/js/sidebar.js"></script>
    <link rel="stylesheet" href="./dist/css/bootstrap.css" />
    <link rel="stylesheet" href="./style.css" />
    <link rel="stylesheet" href="./dist/css/sidebar.css"/>
	<link rel="stylesheet" href="./lib/font-awesome/css/font-awesome.min.css"/>
	<link rel="stylesheet" href="lib/bootstrap-table/dist/bootstrap-table.css">
	<link rel="stylesheet" href="lib/select2/css/select2.min.css">	<!-- Botstrap table plugin -->
	<link rel="stylesheet" href="lib/bootstrap-slider/css/bootstrap-slider.css">
	
	<link href="../iClient/for3D/webgl/examples/css/widgets.css" rel="stylesheet">
    <!--<link href="../iClient/for3D/webgl/examples/css/examples.css" rel="stylesheet">-->
    <!--<link href="../iClient/for3D/webgl/examples/css/flat-ui.css" rel="stylesheet">-->		<!-- What is this flat-ui? -->
	
	<style>
        html, body, #cesiumContainer, #streetViewContainer, #SMapContainer {
            width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden;
        }
		
		#cesiumContainer {
			position: absolute;
		}
		
		#streetViewContainer, #SMapContainer {
			z-index: 1050;
			display: none;
			position: absolute;
		}
		
		.leftIcon {
			margin-top: 10px;
			margin-left: 7px;
			color: white;
		}
		
		#leftPanel {
			position:absolute;
			width: 50px;
			left: 0px;
			top: 0px;
			z-index:1000 !important;
			background-color:#263238;
		}
		
		#leftIconList {
			position: relative;
			/*top: 100px;*/
		}
		
		a, li, h4 {
			font-family: Arial, Helvetica, sans-serif !important;
		}
		
		#upperDiv {
			top: 0px;
			left: 0px;
			width: 100%;
		}
		
		#bottomDiv {
			position: absolute;
			bottom: 0px;
			left: 0px;
			width: 100%;
			z-index: 1000;
		}
		
		.bottom-info {
			opacity: 1 !important;
			color: #000 !important;
			background-color: #EEE !important;
			cursor: default !important;
			margin-left: 1%;
			margin-bottom: 5px;
			height: 25px;
			float:left;
		}
		
		.toolsetPanel {
			background-color: rgba(0, 0, 0, 0) !important;
			border: 0px !important;
			color: #00f8fc;
		}
		
		.toolsetItem3D {
			cursor: pointer;
			color: white;
		}
		
		.toolsetItem2D {
			cursor: pointer;
			color: purple;
		}
		
		/* Hide modal backdrop to make background displayable */
		.modal {
			overflow: hidden;
			bottom:initial! important;
		}
		.modal-backdrop {
			display: none !important;
			pointer-events: none;
		}
		
		.movable {
			-webkit-user-select: none; /* Chrome/Safari */        
			-moz-user-select: none; /* Firefox */
			-ms-user-select: none; /* IE10+ */
		}
		
		th {
			background-color: #eeeeee;
		}

		.cesium-widget-credits {
			display: none !important;
		}
		
		#ex1Slider .slider-selection {
			background: #BABABA;
		}
    </style>
</head>


<body onload='reloadpage()'>
<% 

	
	Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");  
	Connection conn = DriverManager.getConnection(gDBConnStr);
	Statement sta = conn.createStatement();
	
	
	System.out.println("gDBConnStr :" + gDBConnStr);
	
	
	
	String UserKey1;
	
	String UserKey1_EN;
	
	String UserID1;
	String Post1;
	String Password1;
	
	ResultSet rs1;
	
	String UserKey1_DE;
	
	int dateshift;
	
	String sqlstr;
	
	int idx1;
	int user_rid;
	int rows_cnt;
	
	
	dateshift = DateShift();
	
	UserKey1 ="";
	
	if(session.getAttribute( "USER_ID")==null || session.getAttribute( "USER_ID")=="" || session.getAttribute( "USER_ID")=="null" )
	{
	
		System.out.println("USER_ID is null");
		UserKey1_EN = request.getParameter("UserKey");
		
		
		//UserID1 = request.getParameter("txtUserID");
		//Password1  = request.getParameter("txtPassword");
		
		
		if (UserKey1_EN != null && UserKey1_EN != "")
		{
			System.out.println("UserKey1_EN :" + UserKey1_EN);
			UserKey1 = DecryKey_3DGIS(UserKey1_EN);
			System.out.println("UserKey1 :" + UserKey1);	
			idx1 = UserKey1.indexOf("|");
		
			session.setAttribute( "USER_ID" , UserKey1.substring(0,idx1));
			session.setAttribute( "USER_POST" , UserKey1.substring(idx1+1));
		}
		
//		response.sendRedirect("http://www.yahoo.com");
		
		/*
		else if (UserID1 != null && UserID1 != "")
		{
			//No used Form Post now, as using AJAX call in index.jsp
			session.setAttribute( "USER_ID" ,UserID1);
			
			sqlstr = "SELECT POST FROM " + USER_TYPE + " WHERE USERID = '"  + session.getAttribute( "USER_ID") +
				"' AND USER_PWD_EN ='" + Password1 + "'";
				//check password

			rs1 = sta.executeQuery(sqlstr);
			
			if (rs1.next())
			{
				Post1 = rs1.getString("POST");
			}
			else
			{
				Post1 = "XXXXY";
			}
			
			session.setAttribute( "USER_POST" , Post1);
			
		}
		*/
	}
	
	
	//else
	//{
		//System.out.println("USER_ID is not null");
//		
		//response.sendRedirect("http://www.google.com");
	//}
	
	
	//Check if user exists.
	
	sqlstr = "SELECT RID FROM " + USER_TYPE + " WHERE USERID = '"  + session.getAttribute( "USER_ID") +
			"' AND POST ='" + session.getAttribute( "USER_POST") + "'";

	rs1 = sta.executeQuery(sqlstr);
	
	if (rs1.next()) 
	{
		//update last login time
		
		user_rid = rs1.getInt("RID");
		sqlstr = "UPDATE " + USER_TYPE + " SET LST_LOGIN_TIME=GETDATE() WHERE RID = " + user_rid;
		rows_cnt = sta.executeUpdate(sqlstr);



		sqlstr = "INSERT INTO " + SYS_AUDIT + "( LOG_USERID, LOG_POST, LOG_DATE, LOG_MODULE, LOG_FUNCTION, LOG_MESSAGE_1, LOG_STATUS ) VALUES ('" +session.getAttribute( "USER_ID") +"','" + session.getAttribute( "USER_POST") + "',GETDATE(),'ADMIN','LOGIN','Success','INFO')";
			
		System.out.println("Audit Main Sql :" + sqlstr);
	
	
		rows_cnt = sta.executeUpdate(sqlstr);			


	
	}
	else
	{
		//have record on fail try
		sqlstr = "INSERT INTO " + SYS_AUDIT + 
			"( LOG_USERID, LOG_POST, LOG_DATE, LOG_MODULE, LOG_FUNCTION, LOG_MESSAGE_1, LOG_STATUS ) VALUES ('" +
			session.getAttribute( "USER_ID") +"','" + session.getAttribute( "USER_POST") + "',GETDATE(),'ADMIN','LOGIN','Fail','INFO')";

		System.out.println("Audit Fail Sql :" + sqlstr);
	
	
		rows_cnt = sta.executeUpdate(sqlstr);				
	}
%>
<div style="display:none;">

<!-- UserKey: <%=UserKey1  %><br/> <br/> -->


Login User:  <%=session.getAttribute( "USER_ID") %>  ( <%=session.getAttribute( "USER_POST") %> ) 
<br/><br/>
</div>

<div id="loginInfo" style="position:absolute; right:0px; top:0px; background-color:white; z-index:2000;">
	<span style="background-color:white;"> Login User:  <%=session.getAttribute( "USER_ID") %>  ( <%=session.getAttribute( "USER_POST") %> ) </span>
</div>

<div id="trialInfo" style="position:absolute; left:50px; top:0px; background-color:white; z-index:2000;">
	<span style="background-color:white;">For test only</span>
</div>

<!-- Fixed navbar -->
	<div id="upperDiv">
		<div id="leftPanel">
			<button type="button" class="navbar-toggle leftBtn" id="btnLayerManager" data-toggle="sidebar" data-target=".sidebar-left"
				style="display:none;">
			  <span class="icon-bar"></span>
			  <span class="icon-bar"></span>
			  <span class="icon-bar"></span>
			</button>
			
			<button type="button" class="btn btn-primary" id="btnAttributeTable" data-toggle="modal" data-target="#dialogModal" data-backdrop="static" data-keyboard="false" style="display:none;">
				This button shows attribute table
			</button>
			<button type="button" class="btn btn-primary" id="btnFlyToTrigger" data-toggle="modal" data-target="#flyToModal" data-backdrop="static" data-keyboard="false" style="display:none;">
				This button shows fly to modal
			</button>
			<button type="button" class="btn btn-primary" id="btnTranspTrigger" data-toggle="modal" data-target="#transpModal" data-backdrop="static" data-keyboard="false" style="display:none;">
				This button shows transparency control
			</button>
			<button type="button" class="btn btn-primary" id="btnTranspTrigger2D" data-toggle="modal" data-target="#transpModal2D" data-backdrop="static" data-keyboard="false" style="display:none;">
				This button shows transparency control for 2D
			</button>
			<button type="button" class="btn btn-primary" id="btnLayerReorder" data-toggle="modal" data-target="#reorderModal" data-backdrop="static" data-keyboard="false" style="display:none;">
				This button shows layer reorder control for 2D
			</button>
			<button type="button" class="btn btn-primary" id="btnZoomTo" data-toggle="modal" data-target="#zoomToModal" data-backdrop="static" data-keyboard="false" style="display:none;">
				This button shows zoom to control for 2D
			</button>
			
			<div id="leftIconList">
				<i class="fa fa-list fa-2x leftIcon" data-toggle="sidebar" aria-hidden="true" id="iconLayerManager"></i>
			</div>
			
			<div>
				<i class="fa fa-list fa-2x leftIcon" aria-hidden="true" id="iconAttributeTable"></i>
			</div>
		</div>
	  
	  <!-- Begin page content -->
		<div id="viewContainer" style="position:relative; top:0px; left:50px; height:100%; z-index:0;">
			<!-- Debug with cesiumContainer2 -->
			<div id="cesiumContainer"></div>
			<div id="SMapContainer"></div>
			<div id="streetViewContainer"></div>
		</div>
		<div class="container-fluid">
			<div class="row">
			<div class="col-xs-5 col-sm-3 col-md-3 sidebar sidebar-left sidebar-animate">
				<div class="panel-group" id="accordion">
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								<a data-toggle="collapse" data-parent="#accordion" href="#collapseOne">Layer manager</a>
							</h4>
						</div>
						<div id="collapseOne" class="panel-collapse collapse in">
							<div id="3DLayers">
								<ul class="list-group checked-list-box" id="layerList">
									<li class="list-group-item" data-checked="true">DOP5K Ortho</li>
									<li class="list-group-item" data-checked="true">Terrain</li>
									<li class="list-group-item" data-checked="true">Models_3DS_WGS</li>
									<!--<li class="list-group-item" data-checked="true">bldg_wgs</li>
									<li class="list-group-item" data-checked="true">podium_wgs</li>-->
									<li class="list-group-item" data-checked="true">PolyU</li>
									<li class="list-group-item" data-checked="true">cyber_port</li>
									<li class="list-group-item" data-checked="true">TaiKooShing</li>
								</ul>
							</div>
							
							<div id="2DLayers" style="display:none">
								<ul class="list-group checked-list-box" id="layerList2D">
									<li class="list-group-item" data-checked="true">Tree</li>
									<li class="list-group-item" data-checked="true">Building</li>
									<li class="list-group-item" data-checked="true">Podium</li>
									<li class="list-group-item" data-checked="true">DOP</li>
								</ul>
							</div>
						</div>
					</div>
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								<a data-toggle="collapse" data-parent="#accordion" href="#collapseFour">Bookmark manager</a>
							</h4>
						</div>
						<div id="collapseFour" class="panel-collapse collapse">
							Fly to bookmark: <select id="bookmarks" name="bookmarks" style="width: 200px;"></select><br /><br />
							<input type="button" class="btn" value="Add a bookmark for current view" onclick="addBookmark()" /><br /><br />
							<input id="deleteButton" type="button" class="btn" value="Delete selected bookmark" onclick="deleteBookmark()" disabled/>
						</div>
					</div>
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								<a data-toggle="collapse" data-parent="#accordion" href="#collapseFive">Search attribute</a>
							</h4>
						</div>
						<div id="collapseFive" class="panel-collapse collapse">
							Search Application Case number or building name: <br />
							<input type="text" id="queryValue" style="width: 200px;" value="Two International Finance Centre" /><br />
							<button id="searchButton" onclick="searchAttribute();">Search</button>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Enable toolset to be collapsed. Not implemented -->
		<!-- <div id="toolset" style="position:absolute; right:10px; bottom:120px; z-index=3000;">
			<div class="panel-group">
				<div class="panel panel-default toolsetPanel">
					<div id="collapseTool" class="panel-collapse collapse">
						<ul class="list-group checked-list-box" id="layerList">
							<li><a href="#" data-toggle="tooltip" data-placement="left" title="Fly&nbsp;management"><i class="fa fa-plane fa-2x toolsetItem" aria-hidden="true"></i></a></li>
							<li><a href="#" data-toggle="tooltip" data-placement="left" title="Identification"><i class="fa fa-eye fa-2x toolsetItem" aria-hidden="true"></i></a></li>
							<li><a href="#" data-toggle="tooltip" data-placement="left" title="Search"><i class="fa fa-search fa-2x toolsetItem" aria-hidden="true"></i></a></li>
							<li><a href="#" data-toggle="tooltip" data-placement="left" title="Skyline&nbsp;analysis" id="btnSkyline"><i class="fa fa-list-alt fa-2x toolsetItem" aria-hidden="true"></i></a></li>
							<li><a href="#" data-toggle="tooltip" data-placement="left" title="Viewshed&nbsp;analysis" id="btnViewshed"><i class="fa fa-list-alt fa-2x toolsetItem" aria-hidden="true"></i></a></li>
							<li><a href="#" data-toggle="tooltip" data-placement="left" title="Walk&nbsp;mode" id="btnWalkmode"><span class="glyphicon glyphicon-road toolsetItem" style="font-size: 28px;" aria-hidden="true"></span></a></li>
							<!-- <li><a href="#" data-toggle="tooltip" data-placement="left" title="Street&nbsp;view" id="btnStreetView"><span class="glyphicon glyphicon-road toolsetItem" style="font-size: 28px;" aria-hidden="true"></span></a></li>
						</ul>
					</div>
					<div>
						<a data-toggle="collapse" href="#collapseTool" style="text-align: right;">
							<i class="fa fa-wrench fa-2x toolsetItem" aria-hidden="true"></i>
						</a>
					</div>
				</div>
			</div>
		</div> -->
		
		<div id="toolset3D" style="position:absolute; right:10px; bottom:120px; z-index=3000;">
			<a href="#" data-toggle="tooltip" data-placement="left" title="2D&nbsp;Map" class="btnToggleMapMode"><i class="fa fa-map fa-2x toolsetItem3D" aria-hidden="true"></i></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Fly&nbsp;to&nbsp;location" id="iconFlyTo"><i class="fa fa-plane fa-2x toolsetItem3D" aria-hidden="true"></i></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Adjust&nbsp;transparency" id="iconTransp"><i class="fa fa-square-o fa-2x toolsetItem3D" aria-hidden="true"></i></a><br />
			<!-- <li><a href="#" data-toggle="tooltip" data-placement="left" title="Fly&nbsp;management"><i class="fa fa-plane fa-2x toolsetItem" aria-hidden="true"></i></a></li>
			<li><a href="#" data-toggle="tooltip" data-placement="left" title="Identification"><i class="fa fa-eye fa-2x toolsetItem" aria-hidden="true"></i></a></li>
			<li><a href="#" data-toggle="tooltip" data-placement="left" title="Search"><i class="fa fa-search fa-2x toolsetItem" aria-hidden="true"></i></a></li> -->
			<!--<a href="#" data-toggle="tooltip" data-placement="left" title="Profile&nbsp;analysis" id="btnProfile"><i class="fa fa-area-chart fa-2x toolsetItem3D" aria-hidden="true"></i></a><br />-->
			<a href="#" data-toggle="tooltip" data-placement="left" title="Skyline&nbsp;analysis" id="btnSkyline"><i class="fa fa-list-alt fa-2x toolsetItem3D" aria-hidden="true"></i></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Viewshed&nbsp;analysis" id="btnViewshed"><i class="fa fa-list-alt fa-2x toolsetItem3D" aria-hidden="true"></i></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Walk&nbsp;mode" id="btnWalkmode"><span class="glyphicon glyphicon-road toolsetItem3D" style="font-size: 28px;" aria-hidden="true"></span></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Street&nbsp;view" id="btnStreetView"><i class="fa fa-street-view fa-2x toolsetItem3D" aria-hidden="true"></i></a><br />
		</div>
		
		<div id="toolset2D" style="position:absolute; right:10px; bottom:120px; z-index=3000; display: none;">
			<a href="#" data-toggle="tooltip" data-placement="left" title="3D&nbsp;Scene" class="btnToggleMapMode"><i class="fa fa-fort-awesome fa-2x toolsetItem2D" aria-hidden="true"></i></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Zoom&nbsp;to&nbsp;Scale" id="btnSetScale2D"><i class="fa fa-arrows-h fa-2x toolsetItem2D" aria-hidden="true"></i></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Zoom&nbsp;to" id="iconZoomTo"><i class="fa fa-plane fa-2x toolsetItem2D" aria-hidden="true"></i></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Adjust&nbsp;transparency" id="iconTransp2D"><i class="fa fa-square-o fa-2x toolsetItem2D" aria-hidden="true"></i></a><br />
			<a href="#" data-toggle="tooltip" data-placement="left" title="Layer&nbsp;reorder" id="iconLayerReorder"><i class="fa fa-arrows-v fa-2x toolsetItem2D" aria-hidden="true"></i></a><br />
		</div>
	</div>
	
	<div id="bottomDiv">
		<input type="text" class="form-control bottom-info input-sm" id="txtLocation" value="Location" style="width: 24%;" disabled>
		<input type="text" class="form-control bottom-info input-sm" id="txtScaleElev" value="Elevation" style="width: 24%;" disabled>
		<input type="text" class="form-control bottom-info input-sm" id="txtSystemInfo" value="System Message" style="width: 48%;" disabled>
	</div>
	
	<div class="modal fade" id="dialogModal" tabindex="-1" role="dialog" aria-labelledby="dialogModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<span class="modal-title" id="exampleModalLabel">Attribute table</span>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body" id="dialogBody" style="overflow: auto; max-height:800px; max-width:800px;">
					<table class="table table-bordered" id="attributeTable"
                               data-toggle="table"
							   data-height="650"
							   data-pagination="true"
							   data-page-size="10"
							   data-page-list="[10,50,100]"
							   data-show-export="true"
							   data-pagination-first-text="First"
							   data-pagination-pre-text="Previous"
							   data-pagination-next-text="Next"
							   data-pagination-last-text="Last">
					</table>
				</div>
				<!-- <div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
				</div> -->
			</div>
		</div>
	</div>
	
	<div class="modal fade" id="flyToModal" tabindex="-1" role="dialog" aria-labelledby="dialogModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<span class="modal-title">Fly to location</span>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body" id="flyToBody" style="overflow: auto; max-height:600px; max-width:800px;">
					<table>
						<tr>
							<td style="width:300px;">Longitude:</td>
							<td><input id="txtLng"></input></td>
						</tr>
						<tr>
							<td>Latitude:</td>
							<td><input id="txtLat"></input></td>
						</tr>
						<tr>
							<td>Height:</td>
							<td><input id="txtHeight"></input></td>
						</tr>
						<tr>
							<td>Head (deg):</td>
							<td><input id="txtHead"></input></td>
						</tr>
						<tr>
							<td>Tilt (deg):</td>
							<td><input id="txtTilt"></input></td>
						</tr>
					</table>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-dismiss="modal" id="btnFlyTo">Fly to location</button>
				</div>
			</div>
		</div>
	</div>
	
	<div class="modal fade" id="zoomToModal" tabindex="-1" role="dialog" aria-labelledby="dialogModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<span class="modal-title">Zoom to location</span>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body" id="zoomToBody" style="overflow: auto; max-height:600px; max-width:800px;">
					<table>
						<tr>
							<td style="width:300px;">Easting:</td>
							<td><input id="txtEasting"></input></td>
						</tr>
						<tr>
							<td>Northing:</td>
							<td><input id="txtNorthing"></input></td>
						</tr>
					</table>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-dismiss="modal" id="btnZoomToGo">Zoom to location</button>
				</div>
			</div>
		</div>
	</div>
	
	<div class="modal fade" id="transpModal" tabindex="-1" role="dialog" aria-labelledby="dialogModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<span class="modal-title">Change transparency</span>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body" id="transpBody" style="overflow: auto; max-height:600px; max-width:800px;">
					<select id="transpLayers">
						<option value="OZP_Zone_Layer">OZP_Zone_Layer</option>
						<option value="Models_3DS_WGS">Models_3DS_WGS</option>
						<option value="bldg_wgs">bldg_wgs</option>
						<option value="podium_wgs">podium_wgs</option>
						<option value="PolyU">PolyU</option>
						<option value="cyber_port">cyber_port</option>
						<option value="TaiKooShing">TaiKooShing</option>
					</select>
					<br /><br />
					Layer transparency:&nbsp;&nbsp;<input id="ex1" data-slider-id='ex1Slider' type="text" data-slider-min="0" data-slider-max="100" data-slider-step="1" data-slider-value="100"/>
				</div>
			</div>
		</div>
	</div>
	
	<div class="modal fade" id="transpModal2D" tabindex="-1" role="dialog" aria-labelledby="dialogModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<span class="modal-title">Change transparency</span>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body" id="transpBody2D" style="overflow: auto; max-height:600px; max-width:800px;">
					<select id="transpLayers2D">
						<option value="Tree">Tree</option>
						<option value="Building">Building</option>
						<option value="Podium">Podium</option>
						<option value="DOP">DOP</option>
					</select>
					<br /><br />
					Layer transparency:&nbsp;&nbsp;<input id="ex2" data-slider-id='ex1Slider' type="text" data-slider-min="0" data-slider-max="100" data-slider-step="1" data-slider-value="100"/>
				</div>
			</div>
		</div>
	</div>
	
	<div class="modal fade" id="reorderModal" tabindex="-1" role="dialog" aria-labelledby="dialogModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<span class="modal-title">2D layer reorder</span>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body" id="reorderBody" style="overflow: auto; max-height:600px; max-width:800px;">
					<table id="layerReorderTable">
						<tr layerName="Tree">
							<td>Tree</td>
							<td><i class="fa fa-arrow-up fa-2x layerUp" aria-hidden="true" layerName="Tree"></i><i class="fa fa-arrow-down fa-2x layerDown" aria-hidden="true" layerName="Tree"></i></td>
						</tr>
						<tr layerName="Building">
							<td style="width:400px;">Building</td>
							<td><i class="fa fa-arrow-up fa-2x layerUp" aria-hidden="true" layerName="Building"></i><i class="fa fa-arrow-down fa-2x layerDown" aria-hidden="true" layerName="Building"></i></td>
						</tr>
						<tr layerName="Podium">
							<td>Podium</td>
							<td><i class="fa fa-arrow-up fa-2x layerUp" aria-hidden="true" layerName="Podium"></i><i class="fa fa-arrow-down fa-2x layerDown" aria-hidden="true" layerName="Podium"></i></td>
						</tr>
						<tr layerName="DOP">
							<td>DOP</td>
							<td><i class="fa fa-arrow-up fa-2x layerUp" aria-hidden="true" layerName="DOP"></i><i class="fa fa-arrow-down fa-2x layerDown" aria-hidden="true" layerName="DOP"></i></td>
						</tr>
					</table>
				</div>
			</div>
		</div>
	</div>
	<div id="chart" style="width: 600px;height:400px;position: absolute;top: 0;left: 0;bottom : 0;right : 0;margin: auto;display: none;background-color: #ffffff"></div>
	
	
	<!-- Bootstrap table plugin javascripts -->
	<script src="lib/bootstrap-table/dist/bootstrap-table.js"></script>
	<script src="lib/bootstrap-slider/bootstrap-slider.min.js"></script>
    <script src="lib/bootstrap-table/ga.js"></script>
	<script src="lib/select2/js/select2.min.js"></script>
	<script src="lib/bootstrap-table/dist/extensions/select2-filter/bootstrap-table-select2-filter.js"></script>
	<script src="lib/bootstrap-table/dist/extensions/export/bootstrap-table-export.js"></script>
	<script src="lib/bootstrap-table/dist/tableExport.js"></script>
	
	<!-- Cesium and layer manager initiation -->
	<script>
		var host = document.location.host;
		var protocol = document.location.protocol;
		var handler;
		var threeDGIS;		// This should be the core part of all the system views
		var map;
		var dopLayer;
		
		if(host == "")
		{
			host = protocol+"//localhost:8090";
		}
		else
		{
			host = protocol+"//" + host;
		}
		
		// Hard code on 2D map url, using Phase 1 map
		var mapUrl = host + "/iserver/services/map-PlanD_Phase1/rest/maps/Map";
		
		// Hard code on terrain URL for profile analysis
		var profileUrl = host+ '/iserver/services/spatialAnalysis-Phase2_Data/restjsr/spatialanalyst/datasets/HK_DTM_1@10.40.106.82_P2_Sample_Data/terraincalculation/profile.jsonp?returnContent=true';
		
		function onload(Cesium) {
			// Class initiation
			// alert('Logged in as <%=session.getAttribute( "USER_ID") %>  ( <%=session.getAttribute( "USER_POST") %>)');
			
			try
			{
				var viewer = new Cesium.Viewer('cesiumContainer',{
					imageryProvider:new Cesium.SingleTileImageryProvider({
						url : '../iClient/for3D/webgl/examples/images/worldimage.jpg'
					}),
					/*imageryProvider :  new Cesium.BingMapsImageryProvider({
						key : "AjQhMyw76oicHqFz7cUc3qTEy3M2fC2YIbcHjqgyMPuQprNVBr3SsvVdOfmlVc0v",//????(https://www.bingmapsportal.com/)??key
						url : URL_CONFIG.BINGMAP
					}),*/
					terrainProvider : new Cesium.CesiumTerrainProvider({
						url : host+'/iserver/services/3D-Phase2_Data/rest/realspace/datas/HK_DTM_1@dem',
						isSct : true
					})
				});
			}
			catch(e)
			{
				location.reload();
			}
			
			threeDGIS = new ThreeDGIS(
				new ThreeDView(viewer,$('#cesiumContainer'),$('#toolset3D')),
				new TwoDView(null,$('#SMapContainer'),$('#toolset2D')),
				$('#streetViewContainer'),		// Whether to make this a class (contain other functionality?)
				null		// Not implemented
			);
			
			var imageryLayers = viewer.imageryLayers;
			var imageryProvider = new Cesium.SuperMapImageryProvider({
				url: host+'/iserver/services/3D-Phase2_Data/rest/realspace/datas/dop5k201555402_1@data'
				//url: host+'/iserver/services/map-OZP_ZONE/rest/maps/OZP_ZONE_WGS84'
			});
			
			dopLayer = imageryLayers.addImageryProvider(imageryProvider);
			
			var scene = viewer.scene;
			var widget = viewer.cesiumWidget;
			try{
				//??S3M??
				// var ground1Promise = scene.addS3MTilesLayerByScp(URL_CONFIG.SCP_CBD_GROUND1,{name : 'ground1'});
				var buildPromise = scene.addS3MTilesLayerByScp(host+'/iserver/services/3D-Phase2_Data/rest/realspace/datas/AAM_Model@model/config',{
					name : 'Models_3DS_WGS'
				});
				var promiseSet = [/*ground1Promise,*/buildPromise];
				Cesium.when.all(promiseSet,function(layer){
					var viewer = threeDGIS.viewer3D;
					viewer.scene.layers.find('Models_3DS_WGS').selectedColor = new Cesium.Color(1,0,1);
					// viewer.flyTo(viewer.scene.layers.find('Models_3DS_WGS'));
				},function(e){
					if (widget._showRenderLoopErrors) {
						var title = '??SCP??,???????????url???????';
						widget.showErrorPanel(title, undefined, e);
					}
				});
			}
			catch(e){
				if (widget._showRenderLoopErrors) {
					var title = 'An error occurred while rendering.  Rendering has stopped.';
					widget.showErrorPanel(title, undefined, e);
				}
			}
			
			try{
				//??S3M??
				// var ground1Promise = scene.addS3MTilesLayerByScp(URL_CONFIG.SCP_CBD_GROUND1,{name : 'ground1'});
				var buildPromise = scene.addS3MTilesLayerByScp(host+'/iserver/services/3D-PlanD_Phase1/rest/realspace/datas/Config/config',{
					name : 'PolyU'
				});
				var promiseSet = [/*ground1Promise,*/buildPromise];
				Cesium.when.all(promiseSet,function(layer){

				},function(e){
					if (widget._showRenderLoopErrors) {
						var title = '??SCP??,???????????url???????';
						widget.showErrorPanel(title, undefined, e);
					}
				});
			}
			catch(e){
				if (widget._showRenderLoopErrors) {
					var title = 'An error occurred while rendering.  Rendering has stopped.';
					widget.showErrorPanel(title, undefined, e);
				}
			}
			
			try{
				//??S3M??
				// var ground1Promise = scene.addS3MTilesLayerByScp(URL_CONFIG.SCP_CBD_GROUND1,{name : 'ground1'});
				var buildPromise = scene.addS3MTilesLayerByScp(host+'/iserver/services/3D-OSGB_Trial/rest/realspace/datas/CyperPort_s3m/config',{
					name : 'cyber_port'
				});
				var promiseSet = [buildPromise];
				Cesium.when.all(promiseSet,function(layer){
					
				},function(e){
					if (widget._showRenderLoopErrors) {
						var title = '??SCP??,???????????url???????';
						widget.showErrorPanel(title, undefined, e);
					}
				});
			}
			catch(e){
				if (widget._showRenderLoopErrors) {
					var title = 'An error occurred while rendering.  Rendering has stopped.';
					widget.showErrorPanel(title, undefined, e);
				}
			}
			
			try{
				//??S3M??
				// var ground1Promise = scene.addS3MTilesLayerByScp(URL_CONFIG.SCP_CBD_GROUND1,{name : 'ground1'});
				var buildPromise = scene.addS3MTilesLayerByScp(host+'/iserver/services/3D-OSGB_Trial/rest/realspace/datas/TaiKooShing_s3m/config',{
					name : 'TaiKooShing'
				});
				var promiseSet = [buildPromise];
				Cesium.when.all(promiseSet,function(layer){
					viewer.scene.camera.setView({
						destination : new Cesium.Cartesian3(-2423660.455, 5384217.767, 2405095.984),
						orientation: {
							heading : 4.105983880971115,
							pitch : -0.12006301068000136,
							roll : 0.0
						}
					});
				},function(e){
					if (widget._showRenderLoopErrors) {
						var title = '??SCP??,???????????url???????';
						widget.showErrorPanel(title, undefined, e);
					}
				});
			}
			catch(e){
				if (widget._showRenderLoopErrors) {
					var title = 'An error occurred while rendering.  Rendering has stopped.';
					widget.showErrorPanel(title, undefined, e);
				}
			}
			
			// These should be UI matters, but need to wait for Cesium to be initialized
			// Checked list initiate
			$('.list-group.checked-list-box .list-group-item').each(function () {
				// Settings
				var $widget = $(this),
				$checkbox = $('<input type="checkbox" class="hidden" id="'+$widget.html()+'" />'),
				color = ($widget.data('color') ? $widget.data('color') : "primary"),
				style = ($widget.data('style') == "button" ? "btn-" : "list-group-item-"),
				settings = {
					on: {
						icon: 'glyphicon glyphicon-check'
					},
					off: {
						icon: 'glyphicon glyphicon-unchecked'
					}
				};
				
				$widget.css('cursor', 'pointer')
				$widget.append($checkbox);

				// Event Handlers
				$widget.on('click', function () {
					$checkbox.prop('checked', !$checkbox.is(':checked'));
					$checkbox.triggerHandler('change');
					// updateDisplay();
				});
				$checkbox.on('change', function () {
					updateDisplay();
				});
				  
				// Actions
				function updateDisplay() {
					var layerName = $checkbox[0].id;
					var isChecked = $checkbox.is(':checked');
					var viewer = threeDGIS.viewer3D;

					// Set the button's state
					$widget.data('state', (isChecked) ? "on" : "off");

					// Set the button's icon
					$widget.find('.state-icon')
						.removeClass()
						.addClass('state-icon ' + settings[$widget.data('state')].icon);

					// Currently hard code to determine different layer types. Maybe dividing these will be necessary
					if(layerName=='DOP5K Ortho')
					{
						if(isChecked)
						{
							var imageryLayers = viewer.imageryLayers;
							var imageryProvider = new Cesium.SuperMapImageryProvider({
								url: host+'/iserver/services/3D-Phase2_Data/rest/realspace/datas/dop5k201555402_1@data'
								//url: host+'/iserver/services/map-OZP_ZONE/rest/maps/OZP_ZONE_WGS84'
							});
							
							var layer = imageryLayers.addImageryProvider(imageryProvider);
						}
						else
						{
							viewer.imageryLayers.remove(viewer.imageryLayers.get(1));
							//var layer = viewer.imageryLayers.get(2);
							//layer.show = false;
						}
					}
					else if(layerName=='Terrain')
					{
						if(isChecked)
						{
							viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
								url : host+'/iserver/services/3D-Phase2_Data/rest/realspace/datas/HK_DTM_1@dem',
								isSct : true
							});
						}
						else
						{
							viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
						}
					}
					else
					{
						var layerToTrigger = viewer.scene.layers.find(layerName);
						if(layerToTrigger)
							layerToTrigger.visible = isChecked;
					}
					
					var mode = threeDGIS.mode[0];
					if(mode=='2D')
					{
						var layer = threeDGIS.twoDView.map.getLayersByName(layerName);
						layer[0].setVisibility(isChecked);
					}
					// Update the button's color
					// Not implement this yet
					/*if (isChecked) {
						//$widget.addClass(style + color + ' active');
						
					} else {
						//$widget.removeClass(style + color + ' active');
					}*/
				}

				// Initialization
				function init() {
					
					if ($widget.data('checked') == true) {
						$checkbox.prop('checked', !$checkbox.is(':checked'));
					}
					
					updateDisplay();

					// Inject the icon if applicable
					if ($widget.find('.state-icon').length == 0) {
						$widget.prepend('<span class="state-icon ' + settings[$widget.data('state')].icon + '"></span>');
					}
				}
				init();
			});
			
			initBookmark();
			
			var skyline = new Cesium.Skyline(scene);
			
			$("#btnSkyline").click(function () {
				var viewer = threeDGIS.viewer3D;
				var scene = viewer.scene;
				var cartographic = scene.camera.positionCartographic;
				var longitude = Cesium.Math.toDegrees(cartographic.longitude);
				var latitude = Cesium.Math.toDegrees(cartographic.latitude);
				var height = cartographic.height;

				skyline.viewPosition = [longitude, latitude, height];
				
				skyline.pitch = Cesium.Math.toDegrees(scene.camera.pitch);
				skyline.direction = Cesium.Math.toDegrees(scene.camera.heading);
				skyline.build();
			});
			
			// Viewshed analysis
			var viewPosition;

			scene.viewFlag = true;
			var pointHandler = new Cesium.PointHandler(viewer);

			var viewshed3D = new Cesium.ViewShed3D(scene);
			var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

			handler.setInputAction(function(e){
				if (!scene.viewFlag) {
					var position = e.endPosition;
					var last = scene.pickPosition(position);

					var distance = Cesium.Cartesian3.distance(viewPosition, last);

					if(distance > 0 ){
						var cartographic = Cesium.Cartographic.fromCartesian(last);
						var longitude = Cesium.Math.toDegrees(cartographic.longitude);
						var latitude = Cesium.Math.toDegrees(cartographic.latitude);
						var height = cartographic.height;

						viewshed3D.setDistDirByPoint([longitude, latitude, height]);
					}
				}
			},Cesium.ScreenSpaceEventType.MOUSE_MOVE);

			handler.setInputAction(function(e){
				scene.viewFlag = true;
				pointHandler.deactivate();
			},Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

			$("#btnViewshed").click(function() {
				var viewer = threeDGIS.viewer3D;
				
				if(pointHandler.active) {
					pointHandler.deactivate();
					return;
				}

				viewer.entities.removeAll();
				viewshed3D.distance = 0.1;
				scene.viewFlag = true;

				pointHandler.activate();
			});
			
			$('#btnSetScale2D').click(function (){
				var scaleString = prompt('Input scale:');
				
				if($.isNumeric(scaleString))
				{
					var scaleNum = Number(scaleString);
					
					threeDGIS.twoDView.map.zoomToScale(scaleNum);
				}
				else
				{
					var scaleSplit = scaleString.split(':');
					if($.isNumeric(scaleSplit[0]) && $.isNumeric(scaleSplit[1]) && scaleSplit.length==2)
					{
						var scaleNum = Number(scaleSplit[0])/Number(scaleSplit[1]);
						threeDGIS.twoDView.map.zoomToScale(scaleNum);
					}
					else
						// Alert input error
						alert('Input not a number');
				}
			});

			pointHandler.drawCompletedEvent.addEventListener(function(point){
				var position = point.position._value;
				viewPosition = position;

				var cartographic = Cesium.Cartographic.fromCartesian(position);
				var longitude = Cesium.Math.toDegrees(cartographic.longitude);
				var latitude = Cesium.Math.toDegrees(cartographic.latitude);
				var height = cartographic.height;

				if(scene.viewFlag) {
					viewshed3D.viewPosition = [longitude, latitude, height];
					viewshed3D.build();
					scene.viewFlag = false;
				}
			});
			
			// Switch to walk mode and shortcut key for fly
			// Not implementing this before reconstructing the code into classes
			$('#btnWalkmode').click(function() {
				threeDGIS.toggleViewMode3D();
				// movementCtrl.toggle();
			})
			
			initProfile();
			
			// Write this upon attribute appear, not on initialize of cesium
			initAttributeTable();
			
			// Fly to function
			$('#btnFlyTo').click(function() {
				// Validate input not implemented
				if(isNaN($('#txtLng').val()))
				{
					alert('Longitude input not number');
					return;
				}
				if(isNaN($('#txtLat').val()))
				{
					alert('Longitude input not number');
					return;
				}
				if(isNaN($('#txtHeight').val()))
				{
					alert('Longitude input not number');
					return;
				}
				if(isNaN($('#txtHead').val()))
				{
					alert('Longitude input not number');
					return;
				}
				if(isNaN($('#txtTilt').val()))
				{
					alert('Longitude input not number');
					return;
				}
				
				var longitude = Number($('#txtLng').val());
				var latitude = Number($('#txtLat').val());
				var height = Number($('#txtHeight').val());
				var head = Number($('#txtHead').val())*Math.PI/180;
				var tilt = -Number($('#txtTilt').val())*Math.PI/180;
				
				threeDGIS.threeDView.viewer.scene.camera.flyTo({
					destination: Cesium.Cartesian3.fromDegrees(longitude,latitude,height),
					orientation: {
						heading: head,
						pitch: tilt,
						roll: 0
					},
					duration: 2
				});
			});
			
			var transpSlider = $('#ex1').bootstrapSlider({
				formatter: function(value) {
					return value + '%';
				}
			});
			transpSlider.bootstrapSlider('on','slideStop',function(val) {
				var selectedLayer = $('#transpLayers').val();
				if(selectedLayer=='OZP_Zone_Layer')
				{
					threeDGIS.threeDView.viewer.imageryLayers.get(2).alpha = val/100;
				}
				else
				{
					var layer = threeDGIS.threeDView.viewer.scene.layers.find(selectedLayer);
					layer.style3D.fillForeColor.alpha = val/100;
					layer.refresh();
				}
			});
			
			$('#transpLayers').change(function(e) {
				var selectedLayer = $('#transpLayers').val();
				var alpha = 0;
				if(selectedLayer=='OZP_Zone_Layer')
				{
					alpha = threeDGIS.threeDView.viewer.imageryLayers.get(2).alpha;
				}
				else
				{
					var layer = threeDGIS.threeDView.viewer.scene.layers.find(selectedLayer);
					alpha = layer.style3D.fillForeColor.alpha;
				}
				
				transpSlider.bootstrapSlider('setValue',alpha*100);
			});
			
			// Transp for 2D
			var transpSlider2D = $('#ex2').bootstrapSlider({
				formatter: function(value) {
					return value + '%';
				}
			});
			transpSlider2D.bootstrapSlider('on','slideStop',function(val) {
				var selectedLayer = $('#transpLayers2D').val();
				var layer = threeDGIS.twoDView.map.getLayersByName(selectedLayer);
				layer[0].setOpacity(val/100);
			});
			
			$('#transpLayers2D').change(function(e) {
				var selectedLayer = $('#transpLayers2D').val();
				var layer = threeDGIS.twoDView.map.getLayersByName(selectedLayer);
				
				//transpSlider2D.bootstrapSlider('setValue',layer[0].opacity*100);		// 2D map cannot get opacity for layers???
				transpSlider2D.bootstrapSlider('setValue',100);
			});
			
			function initReorderButton() {
				$('.layerUp').click(function() {
					var layerName = this.getAttribute("layerName");
					
					var map = threeDGIS.twoDView.map;
					var layer = map.getLayersByName(layerName)[0];
					map.raiseLayer(layer,1);
					adjustListOrder();
				});
				
				$('.layerDown').click(function() {
					var layerName = this.getAttribute("layerName");
					
					var map = threeDGIS.twoDView.map;
					var layer = map.getLayersByName(layerName)[0];
					map.raiseLayer(layer,-1);
					adjustListOrder();
				});
			}
			initReorderButton();
			
			function adjustListOrder() {
				var map = threeDGIS.twoDView.map;
				var layers = map.layers;
				
				var table = $('#layerReorderTable');
				var tableRows = table.find('tr').get();
				
				$('#layerReorderTable tr').remove();
				var tableHTML = '';
				for(var i=0; i<layers.length; i++)
				{
					var lyrName = layers[i].name;
					var row;
					
					for(var j=0; j<layers.length; j++)
					{
						if(tableRows[j].getAttribute('layerName')==lyrName)
						{
							row = tableRows[j];
							break;
						}
					}
					table.children('tbody').prepend(row);
					//tableHTML += row;
				}
				//table.html(tableHTML);\
				initReorderButton();
			}
		}
	</script>
  
	<!-- UI scripts -->
	<script>
		// Test, to make div draggable
		function startMove(initX, initY, prevX, prevY) {
			$('.movable').on('mousemove', function(event) {
				var thisX = event.pageX - initX;
					thisY = event.pageY - initY;

				$('.movable').offset({
					left: thisX + prevX,
					top: thisY + prevY
				});
			});
		}
		
		$(document).ready(function() {
			var $table = $('#attributeTable');

			$('#dialogModal').on('shown.bs.modal', function () {
				$table.bootstrapTable('resetView');
			});
		
			$("#dialogModal").find(".modal-header").on('mousedown', function(event) {
				$("#dialogModal").addClass('movable');

				var initX = event.pageX;
				var initY = event.pageY;
				
				var lp = $('#dialogModal').css('left');
				var tp = $('#dialogModal').css('top');
				if(!$.isNumeric(lp))
					lp = lp.substring(0,lp.length-2);
				if(!$.isNumeric(tp))
					tp = tp.substring(0,tp.length-2);
					
				var prevX = Number(lp);
				var prevY = Number(tp);
				
				startMove(initX, initY, prevX, prevY);
			});
			
			$(document).on('mouseup', function() {
				$('.movable').off('mousemove');
				$('.movable').removeClass('movable');
			});
			
			var clientWidth = $(window).width();
			var clientHeight = $(window).height();
			
			resizeElement();
			$('[data-toggle="tooltip"]').tooltip();   
			$('#iconLayerManager').on('click', function() {
				$('#btnLayerManager').click();
				var layerManagerLocLeft = $('.sidebar-left').css('left');
					
				if(layerManagerLocLeft == '0px')
				{
					$('.sidebar-left').css('left','50px');
				}
				else
				{
					$('.sidebar-left').css('left','0px');
				}
			});
			
			$('#iconAttributeTable').on('click', function() {
				$('#btnAttributeTable').click();
			});
			
			// This makes popup unclickable...
			$("#btnAttributeTable").on('shown.bs.modal',function(){
				$(document).off('focusin.bs.modal');
			});
			
			$('#iconFlyTo').on('click', function() {
				$('#btnFlyToTrigger').click();
				
				var camera = threeDGIS.threeDView.viewer.scene.camera;
				var cameraCarto = Cesium.Cartographic.fromCartesian(camera.position);
				$('#txtLng').val(cameraCarto.longitude*180/Math.PI);
				$('#txtLat').val(cameraCarto.latitude*180/Math.PI);
				$('#txtHeight').val(cameraCarto.height);
				$('#txtHead').val(camera.heading*180/Math.PI);
				$('#txtTilt').val(-camera.pitch*180/Math.PI);
			});
			
			$("#btnFlyToTrigger").on('shown.bs.modal',function(){
				$(document).off('focusin.bs.modal');
			});
			
			
			$('#iconTransp').on('click', function() {
				$('#btnTranspTrigger').click();
			});
			
			// This makes popup unclickable...
			$("#btnTranspTrigger").on('shown.bs.modal',function(){
				$(document).off('focusin.bs.modal');
			});
			
			$('#iconTransp2D').on('click', function() {
				$('#btnTranspTrigger2D').click();
			});
			
			// This makes popup unclickable...
			$("#btnTranspTrigger2D").on('shown.bs.modal',function(){
				$(document).off('focusin.bs.modal');
			});
			
			$('#iconLayerReorder').on('click', function() {
				$('#btnLayerReorder').click();
			});
			
			// This makes popup unclickable...
			$("#btnLayerReorder").on('shown.bs.modal',function(){
				$(document).off('focusin.bs.modal');
			});
			
			$('#iconZoomTo').on('click', function() {
				$('#btnZoomTo').click();
				
				var mapCenter = threeDGIS.twoDView.map.getCenter();
				$('#txtEasting').val(mapCenter.lon.toFixed(3));
				$('#txtNorthing').val(mapCenter.lat.toFixed(3));
			});
			
			// This makes popup unclickable...
			$("#btnZoomTo").on('shown.bs.modal',function(){
				$(document).off('focusin.bs.modal');
			});
			
			$('#btnZoomToGo').click(function() {
				var map = threeDGIS.twoDView.map;
				map.setCenter(new SuperMap.LonLat(Number($('#txtEasting').val()), Number($('#txtNorthing').val())), 5);
			});
		
			/*$('#get-checked-data').on('click', function(event) {
				event.preventDefault(); 
				var checkedItems = {}, counter = 0;
				$("#check-list-box li.active").each(function(idx, li) {
					checkedItems[counter] = $(li).text();
					counter++;
				});
				$('#display-json').html(JSON.stringify(checkedItems, null, '\t'));
			});*/
		});
		
		$( window ).resize(function() {
			resizeElement();
		});
		
		function resizeElement() {
			$('#viewContainer').width(($(window).width()-50)+'px');
			
			// Changing height of several components, may conclude into one or something
			$('#upperDiv').height(($(window).height()-35)+'px');
			$('#leftPanel').height(($(window).height()-35)+'px');
			$('.sidebar').height(($(window).height()-35)+'px');
		}
		
		function getCheckedData() {
			var checkedItems = {}, counter = 0;
			$("li.active").each(function(idx, li) {
				checkedItems[counter] = $(li).text();
				counter++;
			});
			console.log(JSON.stringify(checkedItems, null, '\t'));
		}
		
		$('#btnStreetView').click(function() {
			if($('#streetViewContainer').css('display')=='none')
				streetViewMode();
			else
				cesiumMode();
		});
		
		$('.btnToggleMapMode').click(function() {
			threeDGIS.toggle23D();
		});
	</script>
	
	<!-- Bookmark manager -->
	<script>
		var bookmark3DUrl = host + '/iserver/services/data-Bookmark/rest/data/datasources/SmBookmark/datasets/Bookmark3D';
		var bookmarkDataUrl = host + '/iserver/services/data-Bookmark/rest/data';
		
		function initBookmark() 	// Write existing bookmarks into the select list
		{
			init();
			$('#bookmarks').on('change', function(){
				var id = $('#bookmarks option:selected').val();
				
				if(id==-1)
					$('#deleteButton').prop('disabled', true);
				else
				{
					var getFeatureParam, getFeatureBySQLService, getFeatureBySQLParams;			
					getFeatureParam = new SuperMap.REST.FilterParameter({
						name: "Bookmark3D@SmBookmark",	// Modify this to switch between 2D and 3D
						attributeFilter: "SMID = " + id
					});
					getFeatureBySQLParams = new SuperMap.REST.GetFeaturesBySQLParameters({
						queryParameter: getFeatureParam,
						datasetNames:["SmBookmark:Bookmark3D"]	// Modify this to switch between 2D and 3D
					});
					getFeatureBySQLService = new SuperMap.REST.GetFeaturesBySQLService(bookmarkDataUrl, {
						eventListeners: {"processCompleted": flyToBookmark, "processFailed": processFailed}});

					getFeatureBySQLService.processAsync(getFeatureBySQLParams);
				}
			});
		}
		
		function init()
		{
			$('#bookmarks').empty();
			
			var getFeatureParam, getFeatureBySQLService, getFeatureBySQLParams;
			getFeatureParam = new SuperMap.REST.FilterParameter({
				name: "Bookmark3D@SmBookmark",
				attributeFilter: "SMID > -1"
			});
			getFeatureBySQLParams = new SuperMap.REST.GetFeaturesBySQLParameters({
				queryParameter: getFeatureParam,
				datasetNames:["SmBookmark:Bookmark3D"],
				toIndex: 9999
			});
			getFeatureBySQLService = new SuperMap.REST.GetFeaturesBySQLService(bookmarkDataUrl, {
				eventListeners: {"processCompleted": findBookmarkCompleted, "processFailed": processFailed}});

			getFeatureBySQLService.processAsync(getFeatureBySQLParams);
		}
		
		function findBookmarkCompleted(getFeaturesEventArgs) {
			$('#bookmarks').append($("<option></option>").attr("value",-1).text("")); 

			var i, len, features, feature, result = getFeaturesEventArgs.result;
			if (result && result.features) {
				features = result.features;
				for (i=0, len=features.length; i<len; i++) {
					feature = features[i];
					
					$('#bookmarks').append($("<option></option>").attr("value",feature.data.SMID).text(feature.data.NAME));
				}
			}
		}
		
		function flyToBookmark(getFeaturesEventArgs) {
			var viewer = threeDGIS.viewer3D;
			
			var i, len, features, feature, result = getFeaturesEventArgs.result;
			if (result && result.features) {
				features = result.features;
				for (i=0, len=features.length; i<len; i++) {
					feature = features[i];
					
					var lat = feature.geometry.y*180/Math.PI;
					var lng = feature.geometry.x*180/Math.PI;
					var height = Number(feature.data.HEIGHT);
					var heading = Number(feature.data.HEADING);
					var tilt = Number(feature.data.TILT);
					
					var time = 3;
					var cartesianPosition = Cesium.Cartesian3.fromDegrees(lng, lat, height);
					
					viewer.camera.flyTo({
						destination: cartesianPosition,
						orientation: {
							heading: heading,
							pitch: tilt,
							roll: 0
						},
						duration: time
					});
				}
				$('#deleteButton').prop('disabled', false);
			}
			else
				$('#deleteButton').prop('disabled', true);
		}
		
		function addBookmark()
		{
			var name = prompt("Specify the name of the bookmark");
			var viewer = threeDGIS.viewer3D;
			
			// Add the current position to bookmark
			var camera = viewer.scene.camera;
			var cameraCartoPosition = Cesium.Cartographic.fromCartesian(camera.position);
			var geometry = new SuperMap.Geometry.Point(cameraCartoPosition.longitude, cameraCartoPosition.latitude);
			
			//var name = "A bookmark";	// Give a textbox to save the bookmark
			if(name!=""&&name!="undefined"&&name!=null)
			{
				// First list which layers involved and whether visible
				var visibleLayers='', invisibleLayers='';
				
				var jsonString = '{"x":'+geometry.x+',"y":'+geometry.y+',"Height":'+cameraCartoPosition.height
					+',"Heading":'+camera.heading+',"Tilt":'+camera.pitch
					+',"Service":"","Scene":"","Name":"'+name
					+'","Visible_Layers":"'+visibleLayers+'","Invisible_Layers":"'+invisibleLayers
					+'","type":"ADD"}';
				
				var dObject = {
					json: jsonString
				};
				
				$.ajax({
					url: host+'/iserver/BookmarkEditing.jsp',
					data: dObject,
					dataType: "json",
					method: 'POST',		// Need more advanced jquery version, later than 1.9.0
					success: function (data) {                                  
						var state = data.state;
						if(state=='Success')
						{
							alert("Bookmark added");
							init();
						}
						else
							alert("Failed to add bookmark");
					},
					error: function(err) {
						alert("AJAX function failed");
						window.open(host+'/iserver/BookmarkEditing.jsp'+'?json='+jsonString);
					}
				});
			}
		}
		
		function deleteBookmark()
		{
			var id = $('#bookmarks option:selected').val();
			
			if(id!=-1)
			{
				var jsonString = '{"ids":[';
					jsonString += id;
					jsonString += '],"type":"DELETE"}';
				
				var dObject = {
					json: jsonString
				};
				
				$.ajax({
					url: host+'/iserver/BookmarkEditing.jsp',
					data: dObject,
					dataType: "json",
					method: 'POST',		// Need more advanced jquery version, later than 1.9.0
					success: function (data) {                                  
						var state = data.state;
						if(state=='Success')
						{
							alert("Delete bookmark success");
							init();
						}
						else
							alert("Delete bookmark failed");
					},
					error: function(err) {
						alert("AJAX function failed");
						window.open(host+'/iserver/BookmarkEditing.jsp'+'?json='+jsonString);
					}
				});
			}
		}
		
		function processFailed(e) {
			alert(e.error.errorMsg);
		}
	</script>
	
	<!-- Attribute search -->
	<script>
		var dataUrl = host + '/iserver/services/data-Phase2_Data/rest/data';
		var tableHTML = '';
		
		function searchAttribute() {
			fields = [];
			var attributeValue = $('#queryValue').val();
			
			var getFeatureParam, getFeatureBySQLService, getFeatureBySQLParams;
			//alert("APP_CASE_NO LIKE '"+attributeValue+"%' OR LOCAT_ADDR LIKE '%"+attributeValue+"%'");

			getFeatureParam = new SuperMap.REST.FilterParameter({
				name: 'AAM_Model@10.40.106.82_P2_Sample_Data',
				//attributeFilter: "APP_CASE_NO='"+attributeValue+"'"
				attributeFilter: "ENAME LIKE '%"+attributeValue+"%'",
				orderBy: "ENAME"
			});
			
			getFeatureBySQLParams = new SuperMap.REST.GetFeaturesBySQLParameters({
				queryParameter: getFeatureParam,
				datasetNames:["10.40.106.82_P2_Sample_Data:AAM_Model"],		// Hardcode
				toIndex: 9999
			});
			getFeatureBySQLService = new SuperMap.REST.GetFeaturesBySQLService(dataUrl, {
				eventListeners: {"processCompleted": featureQueryCompleted, "processFailed": processFailed}
			});

			getFeatureBySQLService.processAsync(getFeatureBySQLParams);
		}
		
		function featureQueryCompleted(getFeaturesEventArgs)
		{
			var viewer = threeDGIS.viewer3D;
			
			var i, len, features, feature, result = getFeaturesEventArgs.result;
			tableHTML = 'Application cases: <br />';
			
			if (result && result.features) {
				// selection3D.removeAll();
				features = result.features;
				
				tableHTML += '<table border="1" id=""><thead style="background-color:#dddddd;">'
				for(var i=0; i<fields.length; i++)
				{
					//Sm
					if (fields[i].substr(0,2) != 'Sm')
					{
						tableHTML += '<th>'+fields[i]+'</th>';
					}
				}
				tableHTML += '</tr>';
				
				console.log(features);
				var selectionIDs = [];
				viewer.scene.layers.find('Models_3DS_WGS').releaseSelection();
				for(var i=0; i<features.length; i++)
				{
					tableHTML += '<tr>'
					var feature = features[i];
					var id = feature.data.SMID;
					selectionIDs.push(id);
					
					var geometry = feature.geometry;
					var center = geometry.getCentroid();
					
					for(var j=0; j<fields.length; j++)
					{
						if (fields[j].substr(0,2) != 'Sm')
						{
							tableHTML += '<td>'+feature.data[fields[j].toUpperCase()]+'</td>';
						}
						
					}
					tableHTML += '</tr>';
				}
				tableHTML += '</table><br />';		// Temporarily only show one result properly
				viewer.scene.layers.find('Models_3DS_WGS').setSelection(selectionIDs);
			}
		}
	</script>
	
	<!-- Attribute table -->
	<script>
		// Already defined on the search session
		// var dataUrl = htmlUrl + '/iserver/services/data-PlanD_Phase1/rest/data';
		var tableHTML = '';
		
		function initAttributeTable() {
			loadAttributeTable('Models_3DS_WGS');	// Hardcode on layer name
        }
		
		function loadAttributeTable(layerName)
		{
			fields = [];
			var getFeatureParam, getFeatureBySQLService, getFeatureBySQLParams;

			getFeatureParam = new SuperMap.REST.FilterParameter({
				name: layerName,
				attributeFilter: "SMID > -1"
			});
			getFeatureBySQLParams = new SuperMap.REST.GetFeaturesBySQLParameters({
				queryParameter: getFeatureParam,
				// datasetNames:["SQLServerSource:"+layerNameSplit[0]],	// Currently hardcode the datasource first
				datasetNames:["10.40.106.82_P2_Sample_Data:AAM_Model"],
				toIndex:999999
			});
			getFeatureBySQLService = new SuperMap.REST.GetFeaturesBySQLService(dataUrl, {
				eventListeners: {"processCompleted": getFeatureCompleted, "processFailed": processFailed}
			});

			getFeatureBySQLService.processAsync(getFeatureBySQLParams);
		}
		
		function getFeatureCompleted(getFeaturesEventArgs)
		{
			var i, len, features, feature, result = getFeaturesEventArgs.result;
			if (result && result.features) {
				features = result.features;
				var firstFeature = features[0];
				
				tableHTML += '<thead><tr>';
				var $table = $('#attributeTable');
				var columns = [];
				for(var paraName in firstFeature.data)
				{
					if(paraName.toUpperCase().substr(0,2) != 'SM')
					{
						fields.push(paraName);
						// tableHTML += '<th data-field="'+paraName+'">'+paraName+'</th>';
						columns.push({
							field: paraName,                   
                            title: paraName,
                            sortable: true,
							filter: {
								type: "input"
							}
						});
					}
				}
				$table.bootstrapTable('refreshOptions',{
					columns:columns,
					filter:true,
					exportDataType: 'all'
				});  
				// tableHTML += '</tr></thead>';
				// $("#attributeTable").html(tableHTML);
				
				var tableRows = [];
				for(var i=0; i<features.length; i++)
				{
					//tableHTML += '<tr>';
					var feature = features[i];
					var tableObj = {};
					for(var j=0; j<fields.length; j++)
					{
						if(fields[j].toUpperCase().substr(0,2) != 'SM')
						{
							tableObj[fields[j]] = feature.data[fields[j]];
								//tableHTML += '<td>'+feature.data[fields[j]]+'</td>';
						}
					}
					tableRows.push(tableObj);
					//tableHTML += '</tr>';
				}
				$table.bootstrapTable('removeAll');
				$table.bootstrapTable('append', tableRows);
			}
		}
	</script>
	
	<!-- Google street view -->
	<script>
		var panorama;	// A variable to store google street view container
	
		function initGoogleStreet() {
			var fenway = {lat: 22.28, lng: 114.14};
			panorama = new google.maps.StreetViewPanorama(
				document.getElementById('streetViewContainer'), {
					position: fenway,
					pov: {
						heading: 34,
						pitch: 0
					},
					linksControl: false,
					panControl: false,
					enableCloseButton: false,
					zoomControl: false
					// addressControl: false
				});
		}
		
		// May also want fov
		function positionStreetView (stLat, stLng, stHeading, stPitch) {
			if(google==undefined)
			{
				alert("Street view not available. Check internet accessibility.");
				return;
			}
			
			$('#streetViewContainer').css('display','block');
			
			panorama = new google.maps.StreetViewPanorama(
				document.getElementById('streetViewContainer'), {
					position: {lat: stLat*180/Math.PI, lng: stLng*180/Math.PI},
					pov: {
						heading: stHeading*180/Math.PI,
						pitch: stPitch*180/Math.PI
					},
					linksControl: false,
					panControl: false,
					enableCloseButton: false,
					zoomControl: false
					// addressControl: false
				});
		}
		
		function streetViewMode () {
			var viewer = threeDGIS.viewer3D;
			
			var cpCarto = viewer.scene.camera.positionCartographic;
			
			var stLat = cpCarto.latitude;
			var stLng = cpCarto.longitude;
			var stHeading = viewer.scene.camera.heading;
			var stPitch = viewer.scene.camera.pitch;
			
			positionStreetView(stLat, stLng, stHeading, stPitch);
		}
		
		function cesiumMode () {
			$('#streetViewContainer').css('display','none');
		}
	</script>
	
	<!-- Profile analysis -->
	<script>
		function initProfile() {
			var viewer = threeDGIS.viewer3D;
			
			$('#btnProfile').click(function() {
				deactiveAll();
				handlerLine.activate();
			});
			function deactiveAll(){
				handlerLine.deactivate();
			}
			function addResultLayer() {
				if(!resultObject){
					alert('No profile line plot!');
					return ;
				}
				var line = CesiumToSuperMap.convertPolyline(Cesium,SuperMap,resultObject);
				// var profileUrl = 'http://pld-3dappdev.pland.hksarg/iserver/services/spatialAnalysis-PlanD_Phase1/restjsr/spatialanalyst/datasets/DTM_2@data/terraincalculation/profile.jsonp?returnContent=true';
				var points = [];
				points.push(new SuperMap.Geometry.Point(line.getVertices()[0].x, line.getVertices()[0].y));
				points.push(new SuperMap.Geometry.Point(line.getVertices()[1].x, line.getVertices()[1].y));
				var serverGeometry = new SuperMap.REST.ServerGeometry({
					id : 0,//???number??
					style : null,
					parts : [2],
					type : 'LINE',
					points : points,
					prjCoordSys : null
				});
				SuperMap.Util.committer({
					method : 'POST',
					url : profileUrl,
					data : {
						line : serverGeometry,
						resampleTolerance : '0.5'
					},
					success : function(args){
						buildProfile(args);
					},
					failure : function(err){
						console.log(err);
					}
				});
			}

			function buildProfile(result){
				var profileRes = result.profile[0];
				var xyCoord = result.xyCoordinate[0];
				if(!profileRes || !xyCoord){
					return ;
				}
				var xMax = 0,yMax = 0;
				var points = profileRes.points;
				var xyCoordPoints = xyCoord.points;
				var arr = [];
				for(var i = 0,j = points.length;i < j;i++){
					var x = points[i].x;
					var y = points[i].y;
					var lon = xyCoordPoints[i].x;
					var lat = xyCoordPoints[i].y;
					arr.push([x,y,lon,lat]);
					xMax = x > xMax ? x : xMax;
					yMax = y > yMax ? y : yMax;
				}
				myChart.clear();
				myChart.setOption({
					title : {
						text : '???'
					},
					tooltip: {
						trigger: 'axis',
						formatter: function (params) {
							var param = params[0];
							var x = param.data[0];
							var y = param.data[1];
							var lon = param.data[2];
							var lat = param.data[3];
							return 'x : ' + lon + '</br>' + 'y : ' + lat + '</br>' + 'z : ' + y;
						},
						axisPointer: {
							animation: false
						}
					},
					toolbox: {
						feature: {
							saveAsImage: {},
							myTool1 : {
								show : true,
								title : '??',
								icon : 'path://M432.45,595.444c0,2.177-4.661,6.82-11.305,6.82c-6.475,0-11.306-4.567-11.306-6.82s4.852-6.812,11.306-6.812C427.841,588.632,432.452,593.191,432.45,595.444L432.45,595.444z M421.155,589.876c-3.009,0-5.448,2.495-5.448,5.572s2.439,5.572,5.448,5.572c3.01,0,5.449-2.495,5.449-5.572C426.604,592.371,424.165,589.876,421.155,589.876L421.155,589.876z M421.146,591.891c-1.916,0-3.47,1.589-3.47,3.549c0,1.959,1.554,3.548,3.47,3.548s3.469-1.589,3.469-3.548C424.614,593.479,423.062,591.891,421.146,591.891L421.146,591.891zM421.146,591.891',
								onclick : function(){
									$('#chart').hide();
								}
							}
						}
					},
					grid: {
						left: '3%',
						right: '4%',
						bottom: '3%',
						containLabel: true
					},
					xAxis : {
						min : 0,
						max : xMax*1.2,
						type : 'value'
					},
					yAxis : {
						type : 'value',
						min : 0,
						max : yMax*1.2
					},
					series : [{
						type : 'line',
						data : arr,
						showSymbol: false,
						color : 'green'
					}],
					backgroundColor : 'white',
					color : '#c23531'
				});
				$('#chart').show();
			}
			
			var scene = viewer.scene;
			
			var resultObject;
			/*var handlerLine = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Line,1);
			handlerLine.drawEvt.addEventListener(function(result){
				resultObject = result.object;
				addResultLayer();
			});
			// viewer.flyTo(imageryLayer);*/
			var myChart = echarts.init(document.getElementById('chart'));
		}
		
		function reloadpage()
{

}


	</script>
	
	<!-- Custom classes -->
	<script src="js/class/movement.js"></script>
	<script src="js/class/viewerComponents/twoDView.js"></script>
	<script src="js/class/viewerComponents/threeDView.js"></script>
	<script src="js/class/viewerComponents/3DGIS.js"></script>
	
	<script src="../iClient/for3D/webgl/examples/js/Convert.js"></script>
	<script src="../iClient/for3D/webgl/examples/js/echarts.min.js"></script>
	<script type="text/javascript" src="../iClient/for3D/webgl/examples/js/require.min.js" data-main="js/main"></script>
	<script src="../iClient/forJavaScript/libs/SuperMap.Include.js"></script>
	
	<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAggVsvpxvMh3YzAhOSwJkjYrlbvvxxFLo&callback=initGoogleStreet" type="text/javascript"></script>
</body>
</html>