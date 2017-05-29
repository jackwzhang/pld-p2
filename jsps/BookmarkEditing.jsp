<%@ page import="java.io.*,java.util.*, javax.servlet.*, javax.servlet.http.*" %>
<%@ page import="net.sf.json.*" %>
<%@ page import="
com.supermap.data.Geometry,
com.supermap.data.GeoRegion,
com.supermap.data.GeometryType,
com.supermap.data.Point2D,
com.supermap.data.Point2Ds,
com.supermap.data.*" %>
<%
	JSONObject req = (JSONObject)JSONSerializer.toJSON(request.getParameter("json"));
	String editType = req.get("type").toString();	// string type parameter
	
	Workspace workspace = new Workspace();

	DatasourceConnectionInfo datasourceconnection = new
			DatasourceConnectionInfo();

	datasourceconnection.setEngineType(EngineType.SQLPLUS);
	datasourceconnection.setServer("PLD-3DDBDEV");
	datasourceconnection.setDatabase("SmBookmark");
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
	DatasetVector dataset = (DatasetVector) datasource.getDatasets().get("Bookmark3D");
	
	//Map value = new HashMap();
    //value.put("BaseHeight", 10);
	
	if(!editType.equals("DELETE"))
	{
		double x = req.getDouble("x");
		double y = req.getDouble("y");
		Point2D point2d = new Point2D(x,y);
		GeoPoint geopoint = new GeoPoint(point2d);
			
		if(editType.equals("ADD"))	// Add features into server, DONE
		{
			Recordset recordset = dataset.getRecordset(false, CursorType.DYNAMIC);
			Map fieldset = new HashMap();
			fieldset.put("Height", req.getDouble("Height"));
			fieldset.put("Heading", req.getDouble("Heading"));
			fieldset.put("Tilt", req.getDouble("Tilt"));
			fieldset.put("Service", req.get("Service"));
			fieldset.put("Scene", req.get("Scene"));
			fieldset.put("Name", req.get("Name"));
			fieldset.put("Visible_Layers", req.get("Visible_Layers"));
			fieldset.put("Invisible_Layers", req.get("Invisible_Layers"));

			recordset.addNew(geopoint,fieldset);
			boolean result = recordset.update();
			
			if(result)
				out.println("{\"state\":\"Success\"}");
			else
				out.println("{\"state\":\"Fail\"}");
		}
		else if(editType.equals("UPDATE"))		// Update a selected feature
		{
			/*
			JSONArray arrFNames = req.getJSONArray("fieldNames");
			JSONArray arrFValues = req.getJSONArray("fieldValues");
			String[] fNames = Arrays.copyOf(arrFNames.toArray(),arrFNames.size(),String[].class);
			String[] fValues = Arrays.copyOf(arrFValues.toArray(),arrFValues.size(),String[].class);
			int id=-1;
			
			for(int i=0; i<fNames.length; i++)
			{
				if(fNames[i].equals("SMID"))
				{
					id = Integer.parseInt(fValues[i]);
					break;
				}
			}
			
			Recordset recordset = dataset.query("SMID="+id, CursorType.DYNAMIC);
			recordset.edit();
			recordset.setGeometry(georegion);
			boolean result = recordset.update();
			*/
			
			out.println("{\"state\":\"Update to be customized.\"}");
		}
	}
	else		// Delete a selected feature
	{
		String idArrayStr = req.getString("ids");
		idArrayStr = idArrayStr.substring(1,idArrayStr.length()-1);
		String[] elems = idArrayStr.split(",");
		int[] ids = new int[elems.length];
		boolean result = true;
		
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
		
		if(result)
			out.println("{\"state\":\"Success\"}");
		else
			out.println("{\"state\":\"Fail\"}");
	}
%>