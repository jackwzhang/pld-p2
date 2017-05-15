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

	// 定义数据源连接信息，假设以下所有数据源设置都存在
	DatasourceConnectionInfo datasourceconnection = new
			DatasourceConnectionInfo();

	 // 设置 SQL 数据源连接需要的参数
	datasourceconnection.setEngineType(EngineType.SQLPLUS);
	datasourceconnection.setServer("PLD-3DDBDEV");
	datasourceconnection.setDatabase("P2_Sample_Data");
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
	DatasetVector dataset = (DatasetVector) datasource.getDatasets().get("Proposed_Building");
	
	//Map value = new HashMap();
    //value.put("BaseHeight", 10);
	
	if(!editType.equals("DELETE") && !editType.equals("UPDATEHEIGHT"))
	{
		JSONArray arr = req.getJSONArray("points");
		
		Point2D[] points = new Point2D[arr.size()];
		for(int i=0; i<arr.size(); i++)
		{
			JSONObject child = arr.getJSONObject(i);
			double x = child.getDouble("x");
			double y = child.getDouble("y");
			points[i] = new Point2D(x,y);
		}
		Point2Ds p2s = new Point2Ds(points);
		GeoRegion georegion = new GeoRegion(p2s);
			
		if(editType.equals("ADD"))	// Add features into server, DONE
		{
			Recordset recordset = dataset.getRecordset(false, CursorType.DYNAMIC);
			Map fieldset = new HashMap();
			try
			{
				double baseheight = req.getDouble("BaseHeight");
				fieldset.put("BASEHEIGHT", baseheight);
			}
			catch(Exception e) {;}
			
			double elev = req.getDouble("Elevation");
			fieldset.put("ELEVATION", elev);
			fieldset.put("BLOCKNAME", "dummy");
			
			recordset.addNew(georegion,fieldset);
			boolean result = recordset.update();
			int id = recordset.getID();
			
			if(result)
				out.println("{\"state\":\"Success\",\"ID\":"+id+"}");
			else
				out.println("{\"state\":\"Fail\"}");
		}
		else if(editType.equals("UPDATE"))		// Update a selected feature
		{
			JSONArray arrFNames = req.getJSONArray("fieldNames");
			JSONArray arrFValues = req.getJSONArray("fieldValues");
			String[] fNames = Arrays.copyOf(arrFNames.toArray(),arrFNames.size(),String[].class);
			String[] fValues = Arrays.copyOf(arrFValues.toArray(),arrFValues.size(),String[].class);
			int id=-1;
			double baseHeight=0, elevation=0;
			
			for(int i=0; i<fNames.length; i++)
			{
				if(fNames[i].equals("SMID"))
					id = Integer.parseInt(fValues[i]);
				try
				{
					if(fNames[i].equals("BASEHEIGHT"))
						baseHeight = Double.parseDouble(fValues[i]);
				}
				catch(Exception e) {;}
				
				if(fNames[i].equals("ELEVATION"))
					elevation = Double.parseDouble(fValues[i]);
			}
			
			Recordset recordset = dataset.query("SMID="+id, CursorType.DYNAMIC);
			recordset.edit();
			recordset.setFieldValue("BASEHEIGHT", baseHeight);
			recordset.setFieldValue("ELEVATION", elevation);
			recordset.setFieldValue("BLOCKNAME", "dummy");
			recordset.setGeometry(georegion);
			boolean result = recordset.update();
			
			if(result)
				out.println("{\"state\":\"Success\"}");
			else
				out.println("{\"state\":\"Fail\"}");
		}
	}
	else if(editType.equals("UPDATEHEIGHT"))
	{
		JSONArray arrFNames = req.getJSONArray("fieldNames");
		JSONArray arrFValues = req.getJSONArray("fieldValues");
		String[] fNames = Arrays.copyOf(arrFNames.toArray(),arrFNames.size(),String[].class);
		String[] fValues = Arrays.copyOf(arrFValues.toArray(),arrFValues.size(),String[].class);
		int id=-1;
		double baseHeight=0, elevation=0;
		
		for(int i=0; i<fNames.length; i++)
		{
			if(fNames[i].equals("SMID"))
				id = Integer.parseInt(fValues[i]);
			else if(fNames[i].equals("ELEVATION"))
				elevation = Double.parseDouble(fValues[i]);
		}
		
		Recordset recordset = dataset.query("SMID="+id, CursorType.DYNAMIC);
		recordset.edit();
		recordset.setFieldValue("ELEVATION", elevation);
		boolean result = recordset.update();
		
		if(result)
			out.println("{\"state\":\"Success\"}");
		else
			out.println("{\"state\":\"Fail\"}");
	}
	else if(editType.equals("DELETE"))		// Delete a selected feature
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