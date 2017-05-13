<%@include file="3DGIS_Constants.jsp"%>
<%@ page import="java.util.*" %>
<%@ page import="java.sql.*" %>
<%@ page import="net.sf.json.*" %>


<% 
	Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");  
	Connection conn = DriverManager.getConnection(gDBConnStr);
	
	JSONObject req = (JSONObject)JSONSerializer.toJSON(request.getParameter("json"));
	
	String uid1 = req.get("uid").toString();
	String pwd1 = req.get("pwd").toString();
	String sqlstr;
	String post1;
	String utype1;
	String ukey1;
	
	ResultSet rs1;
	
	
	Statement sta = conn.createStatement();
	
	
	
	
	sqlstr = "SELECT POST, USER_TYPE FROM " + USER_TYPE + 
		" WHERE USERID ='"+uid1.trim() + "' AND USER_PWD_EN='" + pwd1.trim() + "'" ;
		
	rs1 = sta.executeQuery(sqlstr);
	
	if (rs1.next()) 
	{
		post1 = rs1.getString("POST").trim();
		utype1= rs1.getString("USER_TYPE").trim();
		
		ukey1 = EncryKey_3DGIS(uid1.trim() +"|"+ post1);
		
	}
	else
	{
		post1 = DUMMMY_VALUE;
		utype1 = DUMMMY_VALUE;
		ukey1 = DUMMMY_VALUE;
		
	}
	
	
	
	//int rowsAffected = sta.executeUpdate(Sql);

	
	
	
	conn.close();
	
	//out.print("{\"rows\":12}");
	//int rowsAffected = 123;

	//out.print("{\"rows\":"+rowsAffected+"}");
	
	
	out.print("{ \"upost\" : \""+post1+"\" , \"utype\" : \"" + utype1 + "\" , \"ukey\" : \"" + ukey1 + "\" }");
	
	
%>