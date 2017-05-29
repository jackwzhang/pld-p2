<%@ page import="java.io.*,java.util.*, javax.servlet.*, javax.servlet.http.*" %>
<%@ page import="net.sf.json.*" %>
<%@ page import="
com.supermap.data.Geometry,
com.supermap.data.GeoRegion,
com.supermap.data.GeometryType,
com.supermap.data.Point2D,
com.supermap.data.Point2Ds,
com.supermap.data.*,
com.supermap.data.Recordset.BatchEditor" %>
<%
	JSONObject req = (JSONObject)JSONSerializer.toJSON(request.getParameter("json"));
	String editType = req.get("type").toString();	// string type parameter
	
	Workspace workspace = new Workspace();

	// 定义数据源连接信息，假设以下所有数据源设置都存在
	DatasourceConnectionInfo datasourceconnection = new
			DatasourceConnectionInfo();

	 // 设置 SQL 数据源连接需要的参数
	datasourceconnection.setEngineType(EngineType.SQLPLUS);
	datasourceconnection.setServer("PLD-3DDBDEV");
	datasourceconnection.setDatabase("SmFlyPath");
	datasourceconnection.setUser("sa");
	datasourceconnection.setPassword("Planning1");
	datasourceconnection.setAlias("SQL");
	datasourceconnection.setDriver("SQL Server");
		// 打开数据源
	Datasource datasource = workspace.getDatasources().open(datasourceconnection);
	if (datasource == null) {
		out.println("{\"state\":\"Fail to access datasource\"}");
		return;
	} else {
		//System.out.println("Open datasourc succeed");
	}
	DatasetVector dataset = (DatasetVector) datasource.getDatasets().get("FlyPathVertices");
	
	if(!editType.equals("DELETE"))
	{
		JSONArray arr = req.getJSONArray("points");
		
		//Point2D[] points = new Point2D[arr.size()];
		/*for(int i=0; i<arr.size(); i++)
		{
			JSONObject child = arr.getJSONObject(i);
			double x = child.getDouble("x");
			double y = child.getDouble("y");
			points[i] = new Point2D(x,y);
		}
		Point2Ds p2s = new Point2Ds(points);
		GeoRegion georegion = new GeoRegion(p2s);*/
			
		if(editType.equals("ADD"))	// Add features into server, DONE
		{
			Recordset recordset = dataset.getRecordset(false, CursorType.DYNAMIC);
			
			BatchEditor editor = recordset.getBatch();
			editor.setMaxRecordCount(500);
			//editor.begin();
			
			for(int i=0; i<arr.size(); i++)
			{
				JSONObject child = arr.getJSONObject(i);
				Map fieldset = new HashMap();
				fieldset.put("Altitude", child.getDouble("Altitude"));
				fieldset.put("Heading", child.get("Heading"));
				fieldset.put("Tilt", child.get("Tilt"));
				fieldset.put("PathName", child.get("PathName"));
				fieldset.put("STOPID", child.get("STOPID"));
				fieldset.put("STOPNAME", child.get("STOPNAME"));
				
				double x = child.getDouble("x");
				double y = child.getDouble("y");
				Point2D point2d = new Point2D(x,y);
				GeoPoint geopoint = new GeoPoint(point2d);
				
				recordset.addNew(geopoint,fieldset);
				recordset.update();
			}
			editor.update();
			
			boolean result = true;	// Can it detect whether update successful?
			
			if(result)
				out.println("{\"state\":\"Success\"}");
			else
				out.println("{\"state\":\"Fail\"}");
		}
		else if(editType.equals("UPDATE"))		// Update a selected feature
		{
			; // Nothing to do
		}
	}
	else		// Delete a selected feature
	{
		String idArrayStr = req.getString("ids");
		idArrayStr = idArrayStr.substring(1,idArrayStr.length()-1);
		String[] elems = idArrayStr.split(",");
		int[] ids = new int[elems.length];
		boolean result = true;
		
		if(!elems[0].equals(""))
		{
			for(int i=0; i<elems.length; i++)
			{
				//ids[i] = Integer.parseInt(elems[i]);
				int theID = Integer.parseInt(elems[i]);
				Recordset recordset = dataset.query("SmID="+theID,CursorType.DYNAMIC);
				recordset.moveFirst();
				recordset.edit();
				boolean isSuccess = recordset.delete();
				if(!isSuccess)
					result = false;
				recordset.update();
			}
		}
		
		if(result)
			out.println("{\"state\":\"Success\"}");
		else
			out.println("{\"state\":\"Fail\"}");
	}
%>