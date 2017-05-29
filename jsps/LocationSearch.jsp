<%@ page import="java.io.*,java.util.*, javax.servlet.*, javax.servlet.http.*" %>
<%@ page import="net.sf.json.*" %>
<%@ page import="java.sql.*" %>
<%@ page language="java" contentType="application/json; charset=UTF-8" pageEncoding="UTF-8" %> 
<%@ page trimDirectiveWhitespaces="true" %>

<%
	JSONObject req = (JSONObject)JSONSerializer.toJSON(java.net.URLDecoder.decode(request.getParameter("json"),"UTF-8"));
	String locationName = req.get("name").toString();	// string type parameter
	
	String connectionUrl = "jdbc:sqlserver://PLD-3DDBDEV:1433;" +  
	   "databaseName=R3DGIS_GISDB;user=sa;password=Planning1;";  
	   
	Connection con = null;  
    Statement stmt = null;  
    ResultSet rs = null;  

    try {  
        // Establish the connection.  
        Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");  
        con = DriverManager.getConnection(connectionUrl);  

        // Create and execute an SQL statement that returns some data.  
        String SQL = "SELECT * FROM TBL_SEARCH WHERE NAME LIKE N'%" + locationName + "%'";  
        stmt = con.createStatement();  
        rs = stmt.executeQuery(SQL);  

        // Iterate through the data in the result set and display it.  
		String responseJSON = "[";
		int countItems = 0;
		
		// Regard this directly as datasource name, no need for mapping
		// Map<String,String> datasourceMap = new HashMap<String,String>();  
		
        while (rs.next()) {  
			if(countItems==0)
				countItems++;
			else
				responseJSON += ",";
			
			responseJSON += "{\"SMID\": "+rs.getInt("SmID")+",";
			responseJSON += "\"SmSdriW\": "+rs.getDouble("SmSdriW")+",";
			responseJSON += "\"SmSdriN\": "+rs.getDouble("SmSdriN")+",";
			responseJSON += "\"SmSdriE\": "+(rs.getObject("SmSdriE")!=null?rs.getDouble("SmSdriE"):"null")+",";
			responseJSON += "\"SmSdriS\": "+(rs.getObject("SmSdriS")!=null?rs.getDouble("SmSdriS"):"null")+",";
			responseJSON += "\"Name\": \""+rs.getString("NAME")+"\",";
			responseJSON += "\"LAYERTYPE\": \""+rs.getString("LAYER_TYPE")+"\"}";
        }
		responseJSON += "]";
		
		out.println(responseJSON);
		System.out.println(responseJSON);
    }  
    catch (Exception e) {  
        e.printStackTrace();  
    }  
    finally {  
        if (rs != null) try { rs.close(); } catch(Exception e) {}  
        if (stmt != null) try { stmt.close(); } catch(Exception e) {}  
        if (con != null) try { con.close(); } catch(Exception e) {}  
    }
%>