<%@ page import="java.util.*" %>
<%@ page import="java.sql.*" %>

<%

 
 final String SYS_AUDIT ="SYS_AUDIT";
 final String SYS_USER ="SYS_USER";
 final String USER_TYPE ="USER_TYPE";
 final String MSG_LOGIN_FAIL ="Login Fail, Please check & try again!";
 
 final String DUMMMY_VALUE = "DUMMY123";

 final String gAppLink = "https://pld-3dappdev.pland.hksarg/3dgis_dev/dev";
 final String gDBConnStr  ="jdbc:sqlserver://PLD-3DDBDEV;user=sa;password=Planning1;database=R3DGIS_DB";
 
 final String APP_VER_3DGIS ="2.0";



%>

<%!

int DateShift()
{

	java.util.Date date1 = new java.util.Date();
	
	int datesum;
	
	datesum = date1.getDate() + date1.getMonth()  +  date1.getDay() +  date1.getYear();
	
	datesum = (datesum % 2 ) + 1; 
	
	//datesum =0;
	
	return(datesum);
	

}


String EncryKey_3DGIS (String input1 )
{

//Swap and Increase 
	char[] in = input1.toCharArray();
    int begin=0;
    int end=in.length-1;
    char temp;
	int i;
	int shift1;
		
	shift1= DateShift();
	
    while(end>begin){
        temp = in[begin];
        in[begin]=  (char) ((int)  in[end] + shift1);
        in[end] =  (char) ((int)temp + shift1);
		
		
        end--;
        begin++;
    }
	
	
	
    return new String(in);

	

}


String DecryKey_3DGIS (String input1 )
{

	char[] in = input1.toCharArray();
	int shift1;
	
    int begin=0;
    int end=in.length-1;
    char temp;
	shift1= DateShift();
	
    while(end>begin){
        temp = in[begin];
		in[begin]=  (char) ((int)  in[end] - shift1);
        in[end] =  (char) ((int)temp - shift1);
        end--;
        begin++;
    }
	
	
	
    return new String(in);



}


%>

