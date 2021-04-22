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
  indexName: String = 'ipredict';
  radarName: String = 'radar';
  title = 'iPredict';
  uuid = '';
  allRadars = [];
  allMatch = [];
  newRadarsToCheck = [];
  highValue = [{'radarId':'75158845', 'matches':['75158845','75158846','75158847']},
               {'radarId':'75012545', 'matches':['75012545','75158846']},
               {'radarId':'75255181', 'matches':['75255181']},
               {'radarId':'75165425', 'matches':['75165425','75158846']}];
  possibleSolution = [];
  
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
    interval(5000).subscribe(x => {
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
              //return entry._source.search_result_data.id;
              //return entry._id;
            });
            //this.allRadars = response.hits.hits.map(entry => entry._source.search_result_data.id);
            this.newRadarsToCheck = this.allRadars.filter(value => !this.possibleSolution.includes(value));
            
            this.newRadarsToCheck.forEach(element => {
              //console.log(element);
              this.es.moreLikeThisDoc(this.indexName,this.radarName, element._id)
              .then (response => {
                this.allMatch = response.hits.hits.filter(x => x._score > 50).map(function (entry) {
                  return entry;
                });
                //console.log(this.allMatch[0].fields["search_result_data.id"][0]);
                //console.log(this.allMatch[0]._score);
                //populate possible
                var index = this.possibleSolution.findIndex(x => x.radarId
                                          == element.radarId);
                        index === -1 ? this.possibleSolution.push({
                        "radarId":element.radarId,
                        "solutions":[{"radarId":this.allMatch[0].fields["search_result_data.id"][0],
                        "matching":this.allMatch[0]._score}],
                        }) : console.log("no data found");
                
              })
            })
          }
        });

        /*this.es.moreLikeThisDoc('amp','radar')
            .then (response => {
              var index = this.possibleSolution.findIndex(x => x.radarId
                                                          == response._source.search_result_data.id);
                 index === -1 ? this.possibleSolution.push({
                   "radarId":response._source.search_result_data.id,
                   "solutions":[{"radarId":"23423",
                  "matching":"85"}],
                 }) : console.log("no data found");
            }).error => {
              console.error(error);
            }).then(() => {
              //console.log(this.allRadars);
            });
         */   


        //console.log(this.uuid); 
        /*
        this.es.getAllSolutions()
        .then(response => {
          console.log(response);
          this.returnObj = response;
        }, error => {
          console.error(error);
        }).then(() => {
          console.log('Show Product Completed!');
        });
        
        this.es.getAllProducts('opes', 'phone')
          .then(response => {
            //this.productSources = response.hits.hits;
            this.returnObj = response.hits.hits;
            console.log(this.returnObj[0]._source.search_data[0].full_text);
          }, error => {
            console.error(error);
          }).then(() => {
            console.log('Show Product Completed!');
          });
          */
     });
 }
  ngOnInit(): void {
    /*this.es.getAllProducts('opes', 'phone')
      .then(response => {
        //this.productSources = response.hits.hits;
        this.returnObj = response.hits.hits;
        //console.log(this.returnObj[0]._source.search_data[0].full_text);
      }, error => {
        console.error(error);
      }).then(() => {
        console.log('Show Product Completed!');
      });
      */
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

  getMatch(score): any {
   if(score >= 100) 
      return 'High';
   if(score >= 50)
      return 'close'; 
 }  
}
