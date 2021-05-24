import React, {Component} from "react";

import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";

// import Box from "@material-ui/core/Box";
import componentStyles from "assets/theme/views/admin/icons.js";
import CreateIcon from "@material-ui/icons/Create";
import QuestionCard from './QuestionCard';
import { withStyles } from "@material-ui/core";

class Quora extends Component {
  state = {
    creating : false,
    question : {
      body : "",
      isAnanymous : false
    },
  }
  render() {
    const { classes } = this.props;
    let ques = null;
    if(this.props.QuoraQuestions.length != 0) {
      ques = this.props.QuoraQuestions.map((el,idx) => {
        let user = el.isAnanymous == 0 ? el.user.name : "Ananymous"
        return (
          <Grid item xs = {12} sm = {6} md = {4} component={Box}
          paddingLeft="15px"
          paddingRight="15px">
          <QuestionCard name = {user} isAnanymous = {el.isAnanymous} upvotes = {el.upvotes} downvotes = {el.downvotes} 
            question = {el.questionBody} answers = {el.answers} time = {el.createdAt} key = {idx} 
            id = {el._id}/>
          </Grid>
        )
      } )
    }
    return(
      <>
          <Grid container component={Box} marginBottom="39px">
          <Grid item xs={12}>
            <Card classes={{ root: classes.cardRoot }}>
              <CardHeader
                className={classes.cardHeader}
                title="Recent Questions"
                titleTypographyProps={{
                  component: Box,
                  marginBottom: "0!important",
                  variant: "h3",
                }}
                action={
                    <IconButton color="primary"  aria-label="write a question" onClick={() => { alert('clicked') }} 
                      className={classes.margin}>
                      <CreateIcon fontSize="large"/>
                    </IconButton>
                }
              >
              </CardHeader>
             
              <CardContent>
                <Grid container >
                    {ques}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          </Grid> 
    </>
    )
    }
}


export default withStyles(componentStyles)(Quora);
