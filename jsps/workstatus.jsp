<%@ page import="java.util.*" %>
<%@ page import="java.sql.*" %>
<html>
<head>
	<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
	<meta http-equiv="Pragma" content="no-cache" />
	<meta http-equiv="Expires" content="0" />
	<title>PlanD 3D GIS Time Box Work Status</title>
	<script src="./js/jquery.js"></script>
	<script>
	var htmlUrl = document.location.host;
	if(htmlUrl == "")
	{
		htmlUrl = "http://localhost:8090";
	}
	else
	{
		htmlUrl = "http://" + htmlUrl;
	}
	
	function jsonEscape(str)  {
		return str.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
	}
	function update(rid)
	{
		var stateID = "state"+rid;
		var remarkID = "remark"+rid;
		
		var newState = $('#'+stateID).val();
		var newRemark = $('#'+remarkID).val();
		var jsonString = '{"rid":'+rid+',"state":"'+newState+'","remark":"'+jsonEscape(newRemark)+'"}';
		
		//alert ('newRemark:' + newRemark);
		
		//alert ('jsonString:' + jsonString);
		
		
		var dObject = {
			json: jsonString
		};
		
		$.ajax({
			url: htmlUrl+'/iserver/editComments.jsp',
			data: dObject,
			dataType: "json",
			method: 'POST',		// Need more advanced jquery version, later than 1.9.0
			success: function (data) {                                  
				var rows = data.rows;
				if(rows!=0)
					alert("Comments updated");
			},
			error: function(err) {
				alert("Err update AJAX function failed" + err.responseText);
				window.open(htmlUrl+'/iserver/editComments.jsp'+'?json='+jsonString);
			}
		});
	}
	</script>

</head>
<body>
<% 
	String APP_VER="1.0";
	
	
	
%>
<H2 align="center"><u> PlanD 3D GIS Time Box Work Status (Version: <%=APP_VER %>)</u></H2>

Today: <%= new java.util.Date() %> <br/> 
<!-- <a href="/iserver//PlanD_3DGIS_UAT_Plan.pdf" target="_blank"> UAT Plan </a> -->
<a href="https://dp.pland.hksarg/3dgis_dev" target="_blank"> Testing Site </a>
<br/><br/> 

<table border="1">
<tr>
	<th>Time Box</th>
	<th>Function Code</th>
	<th>Function Description</th>
	<th>Status</th>
	<th>Remarks</th>
</tr>

<% 
	Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");  
	Connection conn = DriverManager.getConnection("jdbc:sqlserver://PLD-3DDBDEV;user=sa;password=Planning1;database=R3DGIS_DB");
	
	Statement sta = conn.createStatement();
	String Sql = "select * from TBL_FUNC";
	ResultSet rs = sta.executeQuery(Sql);
	String funcGroup = "";
	while (rs.next()) {
		if(!rs.getString("FUNC_GROUP").equals(funcGroup))
		{
			funcGroup = rs.getString("FUNC_GROUP");
%>
		<tr>
			<th colspan="4" style="text-align:left; background-color:#afa"><%= funcGroup %></th>
		</tr>
<%
		}
%>
		<tr>
		<td id="func<%= rs.getString("RID") %>"><%= rs.getString("RID") %></td>
<%
		if(rs.getString("WEB_LINK").equals(""))
		{
%>
			<td><%= rs.getString("FUNC_DESC") %></td>
<%
		}
		else
		{
%>
			<td><a href="<%= rs.getString("WEB_LINK")%>" target="_blank"><%= rs.getString("FUNC_DESC") %></a></td>
<%
		}
%>
		<td><input type="text" id="state<%= rs.getString("RID") %>" value="<%= rs.getString("FUNC_STATUS") %>"></input></td>
		<td><textarea rows="3" cols="75" id="remark<%= rs.getString("RID") %>"><%= rs.getString("REMARKS") %></textarea></td>
		<td><%= rs.getString("LST_MODI_BY") %> <br/>
		<input type="button" value="Update" onclick="update(<%= rs.getString("RID") %>);"></input>
		</td>
		</tr>
<%
	}
	conn.close();
%>
</table>
<a href="http://10.40.106.81/iserver/iClient/for3D/webgl/examples/examples.html" target="_blank">Click to view WebGL demos.</a><br />
<a href="https://pld-3dappdev.pland.hksarg/3dgis_dev/dev/index.html" target="_blank">Phase 2 UI draft</a>
</body>
</html>