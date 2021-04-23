import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { interval } from 'rxjs';
import { ElasticsearchService } from './elasticsearch-service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  indexName: String = 'ipredict1';
  radarName: String = 'radar';
  title = 'iPredict';
  uuid = '';
  doNotDisplayRadars = ['75391597'];
  allRadars = [];
  allMatch = [];
  newRadarsToCheck = [];
  possibleSolution = [];
  highValue = [];
  //Basic Demo Data Setup
  
  /*possibleSolution = [
    {"radarId": "74758845",
    "solutions":[
      {"radarId":"74751245","matching": "91.03"},
      {"radarId":"73548966","matching": "82.85"},
      {"radarId":"73665899","matching": "80.42"}
    ]
    },
    {"radarId": "75012545",
    "solutions":[
      {"radarId":"75001545","matching": "85.25"},
      {"radarId":"74052245","matching": "82.21"}
    ]
    },
    {"radarId": "75255181",
    "solutions":[
      {"radarId":"73568845","matching": "93.03"}
    ]
    }
  ];*/
  
  
  /*
{ possible solution example:
    "radarId":"3452644",
    "solutions":[{"radarId":"23423",
                  "matching":"85"}, 
                  {"radarId":"7345389",
                  "matching":"40"}]
}
  */
  constructor(private es: ElasticsearchService, private sanitizer: DomSanitizer){
    interval(10000).subscribe(x => {
      
        this.uuid = uuidv4();

        this.es.getAllDocuments(this.indexName,this.radarName)
        .then(response => {

          
          if(!!response.hits && !!response.hits.hits)  {
            //console.log("##### ID:" + response.hits.hits[0]._id);
            this.allRadars = response.hits.hits.map(function (entry) {
              return {
                "radarId":entry._source.search_result_data.id,
                "_id":entry._id
              }
            });

            
            this.newRadarsToCheck = this.allRadars;

            this.newRadarsToCheck.forEach(element => {
              //console.log(element);
              this.es.moreLikeThisDoc(this.indexName,this.radarName, element._id)
              .then (response => {

                //Demo purposes
                if(this.doNotDisplayRadars.findIndex(x => x ==element.radarId) >= 0) {
                  return;
                }
                
                this.allMatch = [];
            
                response.hits.hits
                .forEach(x => {
                  var max = Math.ceil(response.hits.max_score / 100) * 100;
                  console.log("this score: " + x._score * 100 / max);
                  x._score = (x._score * 100 / max).toFixed(2);
                  this.allMatch.push(x);
                });
                
                var matchObj = {};
                matchObj['radarId'] = element.radarId;
                var solutions = [];
                for(var i = 0; i < this.allMatch.length && i < 3; i++ ) {
                  if(this.allMatch[i]._score > 75) {
                    solutions.push(
                      {
                        "radarId":this.allMatch[i].fields["search_result_data.id"],
                        "matching":this.allMatch[i]._score
                      }
                    );
                  }
                }
                matchObj['solutions'] = solutions; 
                if(matchObj['radarId'] == 75391449) {
                  console.log('repeat');
                }
                var index = this.possibleSolution.findIndex(x => x.radarId==matchObj['radarId']); 
                if(index == -1) {
                  this.possibleSolution.push(matchObj);

                  //Demo purposes
                  if(matchObj['radarId'] == 75061213) {
                    this.highValue.push({'radarId':'75158845', 'matches':['75158845','75158846','75158847']});
                    this.highValue.push({'radarId':'75012545', 'matches':['75012545','75158846']});
                    this.highValue.push({'radarId':'75255181', 'matches':['75255181']});

                   
                    var temp1 = {}; temp1['radarId'] = 75158845;
                    var sol1 = []; 
                    sol1.push({"radarId":74751245,"matching":91.03});
                    sol1.push({"radarId":73548966,"matching": 82.85});
                    sol1.push({"radarId":73665899,"matching": 80.42});
                    temp1['solutions'] = sol1;
                    this.possibleSolution.push(temp1);

                    var temp2 = {}; temp2['radarId'] = 75012545;
                    var sol2 = []; 
                    sol2.push({"radarId":75001545,"matching":85.25});
                    sol2.push({"radarId":74052245,"matching": 82.21});
                    temp2['solutions'] = sol2;
                    this.possibleSolution.push(temp2);

                    var temp3 = {}; temp3['radarId'] = 75255181;
                    var sol3 = []; sol3.push({"radarId":"73568845","matching": 93.03});
                    temp3['solutions'] = sol3;
                    this.possibleSolution.push(temp3);
                  }

                } else {
                  var existingObj = this.possibleSolution[index];
                  this.possibleSolution.splice(index, 1, matchObj);
                    
                }                
              })
            })
          }
        });
     });
 }
  ngOnInit(): void {
  }

  getBgColor(matchCount): any {
    if(matchCount.length >= 3)
      return 'green';
    if(matchCount.length >= 2)
      return 'yellow';
    
    return 'light gray'; 
  }

  getColor(matchCount): any {
    if(matchCount.length >= 3)
      return 'white';
    
    return 'black';
  }

  getTag(matchCount): any {
    if(matchCount.length >= 3) 
      return 'Very High';
    if(matchCount.length >= 2) 
      return 'High';
    
      return 'low';
  }
/*
 getScoreBgColor(match): any {
  if(match >= 70)
    return 'green';
  if(match >= 50)
    return 'yellow';
  
  return 'light gray'; 
}

getScoreColor(match): any {
  if(match >= 70)
    return 'white';
  
  return 'black';
}
*/

getScoreBgColor(match): any {
  if(match >= 90)
    return 'green';
  if(match >= 80)
    return 'yellow';
  
  return 'light gray'; 
}

getScoreColor(match): any {
  if(match >= 90)
    return 'white';
  
  return 'black';
}
/*
notMatching(existing, updated): boolean {
  if(existing.length != updated.length)
    return true;
  
  updated.forEach(ele => {
    var index = this.possibleSolution.findIndex(x => x.radarId==ele.radarId); 
    if(index < 0)
        return true;
  });

  return false;
}
*/
}
