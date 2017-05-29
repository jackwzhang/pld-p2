<%@ page import="java.util.*" %>
<%@ page import="java.sql.*" %>
<%@ page import="net.sf.json.*" %>
<% 
	Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");  
	Connection conn = DriverManager.getConnection("jdbc:sqlserver://PLD-3DDBDEV;user=sa;password=Planning1;database=R3DGIS_DB");
	
	JSONObject req = (JSONObject)JSONSerializer.toJSON(request.getParameter("json"));
	String rid = req.get("rid").toString();
	String state = req.get("state").toString();
	String remark = req.get("remark").toString();
	
	
	remark =remark.replace("\\n","\n");
	
	Statement sta = conn.createStatement();
	/*
	String str = "print me";
	//always give the path from root. This way it almost always works.
	String nameOfTextFile = "D:\\temp\\3dgis_log.txt";
	try {   
		PrintWriter pw = new PrintWriter(new FileOutputStream(nameOfTextFile));
		pw.println(str);
		//clean up
		pw.close();
	} catch(IOException e) {
	out.println(e.getMessage());
	}
	*/
	System.out.println("editComments remark :" + remark);
	
	String Sql = "update TBL_FUNC set FUNC_STATUS = \'"+state+"\', REMARKS = \'"+remark+"\', lst_modi_date = GETDATE() where RID = "+rid;
	
	System.out.println("editComments Sql :" + Sql);
	
	
	int rowsAffected = sta.executeUpdate(Sql);

	out.print("{\"rows\":"+rowsAffected+"}");
	conn.close();
%>